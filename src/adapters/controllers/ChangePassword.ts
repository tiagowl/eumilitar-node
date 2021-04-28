import { Knex } from "knex";
import Controller from "./Controller";
import * as yup from 'yup';
import UserRepository from "../models/User";
import CheckPasswordToken from "./CheckPasswordToken";
import UserUseCase from "../../cases/UserUseCase";

export interface ChangePasswordInterface {
    password: string;
    confirmPassword: string;
    token: string;
}

export const schema = yup.object({
    password: yup.string().required('É preciso criar uma senha nova')
    .min(8, "A senha deve conter pelo menos 8 caracteres").max(16, "A senha deve conter no máximo 16 caracteres"),
    confirmPassword: yup.string().required('É preciso confirmar a senha').min(8).max(16)
        .oneOf([yup.ref('password'), null], "As senhas não coincidem"),
    token: yup.string().required('O token é obrigatório').length(64, 'Token inválido')
})

export default class ChangePasswordController extends Controller<ChangePasswordInterface> {
    private repository: UserRepository;

    constructor(data: ChangePasswordInterface, driver: Knex) {
        super(data, schema, driver);
        this.repository = new UserRepository(driver);
    }

    private async validateToken(token: string) {
        const checker = new CheckPasswordToken({ token }, this.driver);
        const { isValid } = await checker.check();
        if (!isValid || !checker.tokenData) throw { error: 'Token inválido' }
        return checker.tokenData;
    }

    public async updatePassword() {
        const data = await this.validate();
        const tokenData = await this.validateToken(data.token);
        const useCase = new UserUseCase(this.repository);
        const updated = await useCase.updatePassword(tokenData.user_id, data.password);
        return { updated }
    }
}