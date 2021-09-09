import Session, { SessionInterface } from "../entities/Session";
import User from "../entities/User";
import CaseError, { Errors } from "./Error";
import { UserRepositoryInterface } from "./UserUseCase";
import crypto from 'crypto';

export interface SessionRepositoryInterface {
    readonly users: UserRepositoryInterface;
    readonly create: (data: SessionInsertionInterface) => Promise<Session>;
    readonly delete: (filter: Partial<SessionInterface>) => Promise<number>;
}

export interface SessionInsertionInterface {
    token: string;
    loginTime: Date;
    user: number;
    agent: string | undefined;
}

export interface AuthDataInteface {
    email: string;
    password: string;
    agent?: string;
}

export default class SessionCase {
    private readonly repository: SessionRepositoryInterface;

    constructor(repository: SessionRepositoryInterface) {
        this.repository = repository;
    }

    private async generateToken() {
        const head = Math.random().toString(32).substr(2);
        const body = crypto.randomBytes(128).toString('base64');
        return `${head}.${body}`;
    }

    private async create(user: User, agent?: string) {
        return this.repository.create({
            agent,
            token: await this.generateToken(),
            user: user.id,
            loginTime: new Date(),
        });
    }

    public async auth(data: AuthDataInteface) {
        const { email, password, agent } = data;
        const user = await this.repository.users.get({ email });
        if (!user) throw new CaseError('Email inválido', Errors.NOT_FOUND);
        const validPassword = await user.checkPassword(password);
        if (!validPassword) throw new CaseError('Senha inválida', Errors.WRONG_PASSWORD);
        return this.create(user, agent);
    }

    public async delete(token: string) {
        const deleted = await this.repository.delete({ token });
        if (deleted === 0) throw new CaseError('Nenhum token deletado');
    }
}