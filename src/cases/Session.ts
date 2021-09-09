import CaseError, { Errors } from "./Error";
import { UserRepositoryInterface } from "./UserUseCase";

export interface SessionRepositoryInterface {
    readonly users: UserRepositoryInterface;
}

export interface AuthDataInteface {
    email: string;
    password: string;
}

export default class SessionCase {
    private readonly repository: SessionRepositoryInterface;

    constructor(repository: SessionRepositoryInterface) {
        this.repository = repository;
    }

    public async auth(data: AuthDataInteface) {
        const { email, password } = data;
        const user = await this.repository.users.get({ email });
        if (!user) throw new CaseError('Email inválido', Errors.NOT_FOUND);
        const validPassword = await user.checkPassword(password);
        if (!validPassword) throw new CaseError('Senha inválida', Errors.WRONG_PASSWORD);
        return user;
    }
}