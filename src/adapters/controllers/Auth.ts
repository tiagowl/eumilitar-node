import { Knex } from 'knex';
import * as yup from 'yup';
import UserUseCase from '../../cases/UserUseCase';
import User from '../../entities/User';
import UserRepository from '../models/User';
import Controller from './Controller';
import crypto from 'crypto';
import { TokenService } from '../models/Token';

export interface AuthInterface {
    email: string;
    password: string;
}

export type AuthResponse = {
    token?: string,
    email?: string,
    password?: string,
}

export default class AuthController extends Controller<AuthInterface> {
    private repository: UserRepository;

    constructor(data: AuthInterface, driver: Knex) {
        const schema = yup.object().shape({
            email: yup.string().email().required(),
            password: yup.string().required()
        })
        super(data, schema, driver);
        this.repository = new UserRepository(driver);
    }

    private async generateToken() {
        const head = Math.random().toString(32).substr(2);
        const body = crypto.randomBytes(128).toString('base64');
        return `${head}.${body}`;
    }

    private async saveToken(user: User, token: string, userAgent?: string) {
        const service = TokenService(this.driver);
        return service.insert({
            session_id: token,
            login_time: new Date(),
            user_id: user.id,
            user_agent: userAgent,
        })
    }

    public async auth(userAgent?: string): Promise<AuthResponse> {
        try {
            await this.validate();
            const useCase = new UserUseCase(this.repository);
            const auth = await useCase.authenticate(this.data.email, this.data.password)
            if (!!auth.email && !!auth.password) {
                const token = await this.generateToken()
                if (!!useCase.user) this.saveToken(useCase.user, token, userAgent)
                return { token }
            }
            const errors: AuthResponse = {}
            if (!auth.email) errors.email = 'Email inválido';
            if (!auth.password) errors.password = 'Senha inválida';
            return errors;
        } catch (error) {
            return error
        }
    }
}