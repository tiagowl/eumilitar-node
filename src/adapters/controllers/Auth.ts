import * as yup from 'yup';
import UserUseCase from '../../cases/UserUseCase';
import User, { UserInterface } from '../../entities/User';
import UserRepository from '../models/User';
import Controller from './Controller';
import crypto from 'crypto';
import { TokenService } from '../models/Token';
import { Context } from '../interfaces';

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

export interface CheckAuthInterface {
    token: string;
}

export interface CheckAuthResponse {
    isValid: boolean;
    user?: UserInterface;
}

const tokenSchema = yup.object().shape({
    token: yup.string().required('O token de autenticação é obrigatório'),
});

export default class AuthController extends Controller<AuthInterface> {
    private readonly repository: UserRepository;

    constructor(context: Context) {
        super(context, schema);
        this.repository = new UserRepository(context);
    }

    private async generateToken() {
        const head = Math.random().toString(32).substr(2);
        const body = crypto.randomBytes(128).toString('base64');
        return `${head}.${body}`;
    }

    private async saveToken(user: User, token: string, userAgent?: string) {
        try {
            const service = TokenService(this.driver);
            const [saved] = await service.insert({
                session_id: token,
                login_time: new Date(),
                user_id: user.id,
                user_agent: userAgent,
            });
            if (typeof saved !== 'number') throw { message: 'Erro ao salvar token', status: 500 };
        } catch (error: any) {
            this.logger.error(error);
            throw { message: 'Erro ao salvar token', status: 500 };
        }
    }

    private async parseEntity(user: User): Promise<UserInterface> {
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            status: user.status,
            permission: user.permission,
            creationDate: user.creationDate,
            lastModified: user.lastModified,
        };
    }

    public async auth(rawData: AuthInterface, userAgent?: string): Promise<AuthResponse> {
        try {
            const data = await this.validate(rawData);
            const useCase = new UserUseCase(this.repository);
            const auth = await useCase.authenticate(data.email, data.password);
            if (auth.email && auth.password) {
                const token = await this.generateToken();
                if (!!useCase.user) await this.saveToken(useCase.user, token, userAgent);
                return { token };
            }
            if (!auth.email) throw { errors: [['email', 'Email inválido']], status: 400 };
            else throw { errors: [['password', 'Senha inválida']], status: 400 };
        } catch (error: any) {
            this.logger.error(error);
            throw error;
        }
    }

    public async logOut(token: string) {
        try {
            const service = TokenService(this.driver);
            const deleted = await service.where('session_id', token).del();
            if (deleted === 0) throw { message: "Nenhum token encontrado", status: 400 };
            if (deleted > 1) throw { message: "Mais de um registro afetado", status: 500 };
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao deletar token', status: 500 };
        }
    }

    public async checkToken(rawData: CheckAuthInterface): Promise<CheckAuthResponse> {
        try {
            const { token } = await this.validate(rawData, tokenSchema);
            const user = await this.repository.auth(token);
            return { isValid: true, user: await this.parseEntity(user) };
        } catch (error: any) {
            this.logger.error(error);
            return { isValid: false };
        }
    }
}