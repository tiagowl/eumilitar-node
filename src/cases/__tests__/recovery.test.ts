import faker from "faker";
import { v4 } from "uuid";
import Recovery, { RecoveryInterface } from "../../entities/Recovery";
import User from "../../entities/User";
import RecoveryCase, { RecoveryRepositoryInterface, RecoveryInsertionInterface } from "../Recovery";
import { UserRepositoryInterface } from "../User";
import getDb from "./repositories/database";
import RecoveryTestRespository from "./repositories/RecoveryTestRepository";

const db = getDb();

describe('Recuperação de senha', () => {
    const repository = new RecoveryTestRespository(db);
    const useCase = new RecoveryCase(repository, 40 * 60 * 60 * 1000);
    test('Criação', async done => {
        const [selected] = db.users;
        const { recovery, user } = await useCase.create({ email: selected.email, session: v4() });
        expect(recovery).toBeInstanceOf(Recovery);
        expect(user).toBeInstanceOf(User);
        done();
    });
    test('Verificação', async done => {
        const [selected] = await repository.filter({});
        const isValid = await useCase.checkLongToken(selected.token);
        expect(selected.id).toEqual(isValid.id);
        done();
    });
    test('Atualização da senha', async done => {
        const [selected] = await repository.filter({});
        const updated = await useCase.updatePassword({ token: selected.token, password: faker.internet.password() });
        expect(updated).toBeTruthy();
        done();
    });
    test('Criação com token curto', async done => {
        const [selected] = db.users;
        const { recovery, user } = await useCase.create({ email: selected.email, session: v4(), long: false });
        expect(recovery).toBeInstanceOf(Recovery);
        expect(recovery.token.length).toBe(6);
        expect(user).toBeInstanceOf(User);
        done();
    });
    test('Verifiação de token curto', async done => {
        const [selected] = db.users;
        const session = v4();
        const { recovery, user } = await useCase.create({ email: selected.email, session, long: false });
        expect(recovery.token.length).toBe(6);
        const long = await useCase.checkShortToken({ token: recovery.token, session });
        expect(long.user).toBe(user.id);
        expect(long.token.length).toBe(64);
        done();
    });
});
