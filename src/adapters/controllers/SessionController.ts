import { Context } from "../interfaces";
import SessionRepository from "../models/SessionRepository";
import Controller from "./Controller";
import * as yup from 'yup';
import SessionCase from "../../cases/SessionCase";
import CaseError, { Errors } from "../../cases/ErrorCase";
import { SessionInterface } from "../../entities/Session";
import User from "../../entities/User";
import UserController from "./UserController";

export interface AuthInterface {
    email: string;
    password: string;
    agent?: string;
}

export const schema = yup.object({
    email: yup.string().required('O campo "email" é obrigatório').email('Informe um email válido'),
    password: yup.string().required('O campo "senha" é obrigatório'),
    agent: yup.string().nullable().optional(),
});

export const logoutSchema = yup.object().shape({
    token: yup.string().required('O token é obrigatório'),
});

export default class SessionController extends Controller {
    private readonly repository: SessionRepository;
    private readonly useCase: SessionCase;

    constructor(context: Context) {
        super(context);
        this.repository = new SessionRepository(context);
        this.useCase = new SessionCase(this.repository);
    }

    public async auth(data: AuthInterface) {
        try {
            const parsed = await this.validate(data, schema);
            const session = await this.useCase.auth(parsed);
            return { token: session.token };
        } catch (error: any) {
            this.logger.error(error);
            if (error instanceof CaseError) {
                if (error.code === Errors.NOT_FOUND) throw { errors: [['email', 'Email inválido']], status: 400 };
                if (error.code === Errors.WRONG_PASSWORD) throw { errors: [['password', 'Senha inválida']], status: 400 };
            }
            if (error.status) throw error;
            throw { message: 'Erro autenticar', status: 500 };
        }
    }

    public async delete(token: string): Promise<void> {
        try {
            const validated = await this.validate({ token }, logoutSchema);
            await this.useCase.delete(validated.token);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async checkToken(token: string, parse: boolean = true) {
        try {
            const validated = await this.validate({ token }, logoutSchema);
            const user = await this.useCase.checkToken(validated.token);
            if (!parse) return user;
            const users = new UserController(this.context);
            return await users.parseEntity(user);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }
}