import { Context } from "../interfaces";
import SessionRepository from "../models/Sessions";
import Controller from "./Controller";
import * as yup from 'yup';
import SessionCase from "../../cases/Session";
import CaseError, { Errors } from "../../cases/Error";

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

export default class SessionController extends Controller<AuthInterface> {
    private readonly repository: SessionRepository;
    private readonly useCase: SessionCase;

    constructor(context: Context) {
        super(context, schema);
        this.repository = new SessionRepository(context);
        this.useCase = new SessionCase(this.repository);
    }

    public async auth(data: AuthInterface) {
        try {
            const parsed = await this.validate(data);
            const session = await this.useCase.auth(parsed);
            return { token: session.token };
        } catch (error: any) {
            if (error instanceof CaseError) {
                if (error.code === Errors.NOT_FOUND) throw { errors: [['email', 'Email inválido']], status: 400 };
                if (error.code === Errors.WRONG_PASSWORD) throw { errors: [['password', 'Senha inválida']], status: 400 };
            }
            if (error.status) throw error;
            throw { message: 'Erro autenticar', status: 400 };
        }
    }
}