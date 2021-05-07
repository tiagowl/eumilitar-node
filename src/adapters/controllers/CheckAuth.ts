import { Knex } from "knex";
import Controller from "./Controller";
import * as yup from 'yup';
import User, { UserInterface } from "../../entities/User";
import UserRepository from "../models/User";
import { UserView } from "../views/User";

export interface CheckAuthInterface {
    token: string;
}

export interface CheckAuthResponse {
    isValid: boolean;
    user?: UserInterface;
}

const schema = yup.object().shape({
    token: yup.string().required('O token de autenticação é obrigatório'),
})

export default class CheckAuthController extends Controller<CheckAuthInterface> {
    constructor(data: CheckAuthInterface, driver: Knex) {
        super(data, schema, driver);
    }

    private async retrieveUser(token: string): Promise<User> {
        const repository = new UserRepository(this.driver);
        const user = await repository.query
            .innerJoin('login_sessions', 'users.user_id', '=', 'login_sessions.user_id')
            .where('login_sessions.session_id', token)
            .first();
        if (!user) throw new Error('Token inválido');
        return repository.toEntity(user);
    }

    public async check(): Promise<CheckAuthResponse> {
        try {
            const data = await this.validate();
            const user = await this.retrieveUser(data.token);
            return { isValid: true, user: await UserView(user) }
        } catch (error) {
            return { isValid: false }
        }
    }

}