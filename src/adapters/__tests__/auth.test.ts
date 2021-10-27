import faker from "faker";
import { v4 } from "uuid";
import { userFactory, db, saveUser, deleteUser, generateConfirmationToken, saveConfirmationToken, contextFactory } from "../../../tests/shortcuts";
import RecoveryController from "../controllers/Recovery";
import SessionController from "../controllers/Session";
import { EssayThemeService } from "../models/EssayTheme";
import { RecoveryService } from "../models/Recovery";
import { SessionService } from "../models/Session";
import { UserService } from "../models/User";
import crypto from 'crypto';

const context = contextFactory();

describe('#1 Testes na autenticação', () => {
    const user = userFactory();
    beforeAll(async (done) => {
        const service = UserService(db)
            .onConflict().merge();
        await saveUser(user, service);
        const themeService = EssayThemeService(db);
        await themeService.delete().del();
        done();
    });
    afterAll(async (done) => {
        const service = UserService(db);
        await deleteUser(user, service);
        const themeService = EssayThemeService(db);
        await themeService.del().delete();
        done();
    });
    test('Login correto', async (done) => {
        const credentials = {
            email: user.email,
            password: user.passwd
        };
        const controller = new SessionController(context);
        const token = await controller.auth(credentials);
        expect(token.token).not.toBeNull();
        const sessionService = SessionService(db);
        sessionService.where('session_id', token.token).then(dbToken => {
            expect(dbToken[0]).not.toBeNull();
            done();
        });
    });
    test('Recuperação de senha', async (done) => {
        await UserService(db).where('user_id', user.user_id).update({ phone: faker.phone.phoneNumber('3333333333333') });
        const userData = await UserService(db).where('email', user.email).first();
        const controller = new RecoveryController(context);
        const response = await controller.recover({ email: user.email, type: 'email', session: v4() });
        expect(response).toEqual({ message: "Email enviado! Verifique sua caixa de entrada." });
        const passwordService = RecoveryService(db);
        const token = await passwordService.where('user_id', userData?.user_id).first();
        expect(token).not.toBeNull();
        expect(token).not.toBeUndefined();
        expect(token?.token).not.toBeNull();
        expect(token?.token).not.toBeUndefined();
        done();
    });
    test('Recuperação de senha com sms', async (done) => {
        const service = UserService(db);
        const userData = await service.where('email', user.email).first();
        const controller = new RecoveryController(context);
        const session = v4();
        const response = await controller.recover({ email: user.email, type: 'sms', session });
        expect(response).toEqual({ message: "SMS enviado para +33 (33) 3 33xx-xx33, verifique sua caixa de mensagens" });
        const passwordService = RecoveryService(db);
        const token = await passwordService.where({ 'user_id': userData?.user_id, selector: session }).first();
        expect(token).not.toBeNull();
        expect(token).not.toBeUndefined();
        expect(token?.token).not.toBeNull();
        expect(token?.token).not.toBeUndefined();
        const long = await controller.checkShortToken({ session, token: token?.token || '' });
        expect(long.token.length).toBe(64);
        done();
    });
    test('Recuperação de senha com email errado', async (done) => {
        const controller = new RecoveryController(context);
        try {
            await controller.recover({ email: 'wrong@mail.com', type: 'email', session: v4() });
        } catch (error: any) {
            expect(error, JSON.stringify(error)).toEqual({ message: 'Email inválido', status: 400 });
        }
        done();
    });
    test('Recuperação de senha com email inválido', async done => {
        const controller = new RecoveryController(context);
        try {
            await controller.recover({ email: 'wrongmail.com', type: 'email', session: v4() });
        } catch (error: any) {
            expect(error).toMatchObject({
                message: "Email inválido",
                errors: [["email", "Email inválido",]],
                status: 400,
            });
        }
        done();
    });
    test('Verificar token de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const service = UserService(db);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, db);
        const controller = new RecoveryController(context);
        const { isValid } = await controller.check({ token });
        expect(isValid).toBeTruthy();
        done();
    });
    test('Verificar token expirado de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const service = UserService(db);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, db, new Date(Date.now() - 1000));
        const controller = new RecoveryController(context);
        const { isValid } = await controller.check({ token });
        expect(isValid).toBeFalsy();
        done();
    });
    test('Verificar token expirado de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const service = UserService(db);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, db, new Date(0));
        const controller = new RecoveryController(context);
        const { isValid } = await controller.check({ token });
        expect(isValid).toBeFalsy();
        done();
    });
    test('Verificar token inválido de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const invalidToken = await generateConfirmationToken();
        const service = UserService(db);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, db);
        const controller = new RecoveryController(context);
        const { isValid } = await controller.check({ token: invalidToken });
        expect(isValid).toBeFalsy();
        done();
    });
    test('Verificar token inválido de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const invalidToken = (await generateConfirmationToken()).slice(0, 15);
        const service = UserService(db);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, db);
        const controller = new RecoveryController(context);
        const { isValid } = await controller.check({ token: invalidToken },);
        expect(isValid).toBeFalsy();
        done();
    });
    test('Mudar senha', async done => {
        const token = await generateConfirmationToken();
        const service = UserService(db);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, db);
        const newPassword = 'newPassword';
        const controller = new RecoveryController(context);
        const updated = await controller.updatePassword({
            password: newPassword,
            confirmPassword: newPassword,
            token,
        });
        expect(updated).toEqual({ updated: true });
        const { isValid } = await controller.check({ token },);
        expect(isValid).toBeFalsy();
        done();
    });
    test('Verificar autenticação', async (done) => {
        const credentials = {
            email: user.email,
            password: 'newPassword'
        };
        const auth = new SessionController(context);
        const { token } = await auth.auth(credentials);
        const controller = new SessionController(context);
        const response = await controller.checkToken(token);
        expect(response).not.toBeNull();
        expect(response).not.toBeUndefined();
        expect(response?.email).toEqual(user.email);
        done();
    });
    test('Verificar autenticação com token inválido', async (done) => {
        const token = crypto.randomBytes(32).toString('base64');
        const controller = new SessionController(context);
        await controller.checkToken(token).catch(error => {
            expect(error.message).toEqual('Não autorizado');
            expect(error.status).toEqual(401);
        });
        done();
    });
    test('logout', async done => {
        const credentials = {
            email: user.email,
            password: 'newPassword'
        };
        const controller = new SessionController(context);
        const { token } = await controller.auth(credentials);
        await controller.delete(token);
        done();
    });
});