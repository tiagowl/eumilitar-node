import { Knex } from 'knex';
import yup, { ValidationError } from 'yup';
import { RepositoryInterface } from '../../cases/interfaces';
import UserUseCase, { UserFilter } from '../../cases/UserUseCase';
import User from '../../entities/User';
import UserRepository from '../models/User';
import Controller from './Controller';
import crypto from 'crypto';
import { TokenService } from '../models/Token';

export interface AuthInterface {
    email: string;
    password: string;
}

export default class AuthController extends Controller<AuthInterface> {
    private repository: RepositoryInterface<User, UserFilter>;

    constructor(data: AuthInterface, driver: Knex) {
        const schema = yup.object().shape({
            email: yup.string().email('Informe um email válido').required('O campo email é obrigatório'),
            password: yup.string().required('O campo senha é obrigatório')
        })
        super(data, schema, driver);
        this.repository = new UserRepository(driver);
    }

    private async generateToken() {
        const head = Math.random().toString(32).substr(2);
        const body = crypto.randomBytes(128).toString('utf-8');
        return `${head}.${body}`
    }

    private async saveToken(user: User, token: string) {
        const service = TokenService(this.driver);
        return service.insert({
            token,
            creation_date: new Date(),
            user_id: user.id,
        }).returning('*')
    }

    public async auth() {
        try {
            await this.validate();
            const useCase = new UserUseCase(this.repository)
            const auth = await useCase.authenticate(this.data.email, this.data.password)
            if(!!auth.email && !!auth.password) {
                const token = await this.generateToken()
                if(!!useCase.user) this.saveToken(useCase.user, token)
                return { token: token }
            }
            const errors = {}
            if(!auth.email) Object.defineProperty(errors, 'email', 'Email inválido');
            if(!auth.password) Object.defineProperty(errors, 'password', 'Senha inválida');
            return errors;
        } catch (error) {
            return {
                errors: error.errors
            }
        }
    }
}