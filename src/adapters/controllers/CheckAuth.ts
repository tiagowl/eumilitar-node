import { Knex } from "knex";
import Controller from "./Controller";
import * as yup from 'yup';
import User, { UserInterface } from "../../entities/User";
import UserRepository from "../models/User";
import { UserView } from "../views/User";
import { Logger } from 'winston';
import { Context } from "../interfaces";

export interface CheckAuthInterface {
    token: string;
}

export interface CheckAuthResponse {
    isValid: boolean;
    user?: UserInterface;
}

const schema = yup.object().shape({
    token: yup.string().required('O token de autenticação é obrigatório'),
});

export default class CheckAuthController extends Controller<CheckAuthInterface> {
    constructor(context: Context) {
        super(context, schema);
    }

    private async retrieveUser(token: string): Promise<User> {
        const repository = new UserRepository(this.driver, this.logger);
        const user = await repository.query
            .innerJoin('login_sessions', 'users.user_id', '=', 'login_sessions.user_id')
            .where('login_sessions.session_id', token)
            .first();
        if (!user) throw new Error('Token inválido');
        const userData = await repository.toEntity(user);
        return new User(userData);
    }

    public async check(rawData: CheckAuthInterface): Promise<CheckAuthResponse> {
        try {
            const data = await this.validate(rawData);
            const user = await this.retrieveUser(data.token);
            return { isValid: true, user: await UserView(user) };
        } catch (error) {
            this.logger.error(error);
            return { isValid: false };
        }
    }

}