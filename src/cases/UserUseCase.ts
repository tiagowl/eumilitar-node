import User, { AccountStatus, AccountPermission } from "../entities/User";
import bcrypt from 'bcrypt';

export interface UserFilter {
    id?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    status?: AccountStatus;
    creationDate?: Date;
    lastModified?: Date;
    permission?: AccountPermission;
}

export interface UserRepositoryInterface {
    get: (filter: UserFilter) => Promise<User | null | undefined>;
    filter: (filter: UserFilter) => Promise<this>;
    update: (data: UserFilter) => Promise<number>;
    all(): Promise<User[]>;
}

export default class UserUseCase {
    #saltRounds: number = 10;
    #user: User | undefined | null;
    private repository: UserRepositoryInterface;

    constructor(repository: UserRepositoryInterface) {
        this.repository = repository;
    }

    public async authenticate(email: string, password: string) {
        try {
            const user = await this.repository.get({ email });
            this.#user = user;
            return {
                email: !!user,
                password: !!user && await user.checkPassword(password, bcrypt.compare)
            };
        } catch (error) {
            return {
                email: false,
                password: false,
            };
        }
    }

    get user() { return this.#user; }

    private async hashPassword(password: string) {
        const salt = await bcrypt.genSalt(this.#saltRounds);
        return bcrypt.hash(password, salt);
    }

    public async updatePassword(id: number, password: string) {
        this.#user = await this.repository.get({ id });
        if (!!this.#user) {
            const hash = await this.hashPassword(password);
            this.#user.password = hash;
            const filtered = await this.repository.filter({ id });
            const amount = await filtered.update({
                password: hash,
                lastModified: this.#user.lastModified
            });
            if (amount > 1) throw new Error('Mais de um usuário afetado');
            return !!amount;
        }
        return false;
    }

    public async get(id: number) {
        this.#user = await this.repository.get({ id });
        if(!this.#user) throw new Error('Usuário não encontrado');
        return this.#user;
    }

    public async listAll(filter?: UserFilter) {
        return (await this.repository.filter(filter || {})).all();
    }

}
