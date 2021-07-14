import { Knex } from 'knex';
import * as yup from 'yup';
import UserUseCase from '../../cases/UserUseCase';
import User from '../../entities/User';
import UserRepository from '../models/User';
import Controller from './Controller';
import crypto from 'crypto';
import { TokenService } from '../models/Token';
import { ValidationError } from 'yup';
import { Logger } from 'winston';

export interface AuthInterface {
    email: string;
    password: string;
}

export type AuthResponse = {
    token?: string,
    errors?: [keyof AuthInterface, string][]
};

export const schema = yup.object({
    email: yup.string().required('O campo "email" é obrigatório').email('Informe um email válido'),
    password: yup.string().required('O campo "senha" é obrigatório')
});

export default class AuthController extends Controller<AuthInterface> {
    private repository: UserRepository;

    constructor(driver: Knex, logger: Logger) {
        super(schema, driver, logger);
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
        });
    }

    public async auth(rawData: AuthInterface, userAgent?: string): Promise<AuthResponse> {
        const data = await this.validate(rawData);
        const useCase = new UserUseCase(this.repository);
        const auth = await useCase.authenticate(data.email, data.password);
        if (!!auth.email && !!auth.password) {
            const token = await this.generateToken();
            if (!!useCase.user) this.saveToken(useCase.user, token, userAgent);
            return { token };
        }
        if (!auth.email) throw { errors: [['email', 'Email inválido']] };
        else throw { errors: [['password', 'Senha inválida']] };
    }

    public async logOut(token: string) {
        try {
            const service = TokenService(this.driver);
            const deleted = await service.where('session_id', token).del();
            if (deleted === 0) throw { message: "Nenhum token encontrado", status: 400 };
            if (deleted > 1) throw { message: "Mais de um registro afetado", status: 500 };
        } catch (error) {
            if (error.status) throw error;
            throw { message: 'Erro ao deletar token', status: 500 };
        }
    }
}