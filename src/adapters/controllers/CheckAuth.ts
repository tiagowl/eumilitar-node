import { Knex } from "knex";
import Controller from "./Controller";
import * as yup from 'yup';
import User from "../../entities/User";
import { TokenModel, TokenService } from "../models/Token";
import UserRepository from "../models/User";

export const schema = yup.object().shape({
    token: yup.string().required('O token é obrigatório'),
})

interface CheckAuthInterface {
    token: string;
}

interface CheckAuthResponse {
    isAuthenticated: boolean;
    user?: User;
}

export default class CheckAuthController extends Controller<CheckAuthInterface> {
    constructor(data: CheckAuthInterface, driver: Knex) {
        super(data, schema, driver);
    }

    private async checkToken(token: string): Promise<TokenModel> {
        const service = TokenService(this.driver);
        const tokenData = await service.where('session_id', token).first();
        if (!tokenData) throw new Error('Token inválido');
        return tokenData;
    }

    private async getUserFromToken(token: TokenModel): Promise<User> {
        const repository = new UserRepository(this.driver);
        const user = await repository.get({ id: token.user_id });
        if (!user) throw new Error('Usuário não encontrado');
        return user;
    }

    public async check(): Promise<CheckAuthResponse> {
        try {
            const data = await this.validate();
            const token = await this.checkToken(data.token);
            const user = await this.getUserFromToken(token);
            return { user, isAuthenticated: true }
        } catch {
            return { isAuthenticated: false }
        }
    }
}