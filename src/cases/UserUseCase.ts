import User, { AccountStatus, AccountPermission, UserInterface, UserData } from "../entities/User";
import bcrypt from 'bcrypt';
import CaseError from "./Error";
import { Paginated, Pagination } from "./interfaces";

export type UserPagination = Pagination<User>;

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
    pagination?: UserPagination;
    search?: string;
}

export type UserPaginated = Paginated<User>;

export interface UserCreation {
    firstName: string;
    lastName: string;
    email: string;
    status: AccountStatus;
    permission: AccountPermission;
    password: string;
}

export interface UserSavingData {
    firstName: string;
    lastName: string;
    email: string;
    status: AccountStatus;
    permission: AccountPermission;
    creationDate: Date;
    lastModified: Date;
    password: string;
}

export interface UserRepositoryInterface {
    readonly get: (filter: UserFilter) => Promise<User | null | undefined>;
    readonly filter: (filter: UserFilter) => Promise<User[] | UserPaginated>;
    readonly update: (id: number, data: UserFilter) => Promise<number>;
    readonly save: (user: UserSavingData) => Promise<User>;
}

export default class UserUseCase {
    #saltRounds: number = 10;
    #user: User | undefined | null;
    private readonly repository: UserRepositoryInterface;

    constructor(repository: UserRepositoryInterface) {
        this.repository = repository;
    }

    public async authenticate(email: string, password: string) {
        try {
            const user = await this.repository.get({ email });
            const exists = user instanceof User;
            if (exists) this.#user = user;
            return {
                email: exists,
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
            const amount = await this.repository.update(id, {
                password: hash,
                lastModified: this.#user.lastModified
            });
            if (amount > 1) throw new CaseError('Mais de um usuário afetado');
            return !!amount;
        }
        return false;
    }

    public async get(id: number) {
        this.#user = await this.repository.get({ id });
        if (!this.#user) throw new CaseError('Usuário não encontrado');
        return this.#user;
    }

    public async listAll(filter: UserFilter = {}) {
        return this.repository.filter(filter || {});
    }

    public async create(data: UserCreation) {
        return this.repository.save({
            ...data,
            password: await this.hashPassword(data.password),
            lastModified: new Date(),
            creationDate: new Date(),
        });
    }

}
