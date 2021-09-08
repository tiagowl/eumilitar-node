import Controller from "./Controller";
import * as yup from 'yup';
import UserRepository from "../models/User";
import CheckPasswordToken from "./CheckPasswordToken";
import UserUseCase from "../../cases/UserUseCase";
import { PasswordRecoveryService } from "../models/PasswordRecoveries";
import { Context } from "../interfaces";

export interface ChangePasswordInterface {
    password: string;
    confirmPassword: string;
    token: string;
}

export interface ChangePasswordResponse {
    updated: boolean;
}

export const schema = yup.object().shape({
    password: yup.string()
        .required('É preciso criar uma senha nova')
        .min(8, "A senha deve conter pelo menos 8 caracteres")
        .max(16, "A senha deve conter no máximo 16 caracteres"),
    confirmPassword: yup.string()
        .required('É preciso confirmar sua senha')
        .oneOf([yup.ref('password')], "As senhas não coincidem"),
    token: yup.string()
        .required('O token é obrigatório')
        .length(64, 'Token inválido')
});

export default class ChangePasswordController extends Controller<ChangePasswordInterface> {
    private readonly repository: UserRepository;

    constructor(context: Context) {
        super(context, schema);
        this.repository = new UserRepository(context);
    }

    private async validateToken(token: string) {
        try {
            const checker = new CheckPasswordToken(this.context);
            const { isValid } = await checker.check({ token });
            if (!isValid || !checker.tokenData) throw { message: 'Token inválido' };
            return checker.tokenData;
        } catch (error: any) {
            this.logger.error(error);
            throw { message: error.message || 'Erro ao validar token', status: 400 };
        }
    }

    private async deleteToken(token: string) {
        try {
            const service = PasswordRecoveryService(this.driver);
            return await service.where('token', token).del();
        } catch (error: any) {
            this.logger.error(error);
            throw { message: 'Erro ao deletar token', status: 500 };
        }
    }

    public async updatePassword(rawData: ChangePasswordInterface) {
        try {
            const data = await this.validate(rawData);
            const tokenData = await this.validateToken(data.token);
            const useCase = new UserUseCase(this.repository);
            const updated = await useCase.updatePassword(tokenData.user_id, data.password);
            if (updated) await this.deleteToken(data.token);
            else throw { message: 'Senha não atualizada' };
            return { updated };
        } catch (error: any) {
            this.logger.error(error);
            throw { message: error.message || "Erro ao atualizar senha", status: 400 };
        }
    }
}