import User, { AccountStatus, AccountPermission, UserInterface, UserData } from "../entities/User";
import bcrypt from 'bcrypt';
import CaseError, { Errors } from "./Error";
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

export interface UserUpdate {
    firstName: string;
    lastName: string;
    email: string;
    status: AccountStatus;
    permission: AccountPermission;
    password?: string;
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

export interface AuthResponse {
    email: boolean;
    password: boolean;
}

export interface UserRepositoryInterface {
    readonly get: (filter: UserFilter) => Promise<User | null | undefined>;
    readonly filter: (filter: UserFilter) => Promise<User[] | UserPaginated>;
    readonly update: (id: number, data: UserFilter) => Promise<number>;
    readonly save: (user: UserSavingData) => Promise<User>;
}

export default class UserUseCase {
    readonly #saltRounds: number = 10;
    private readonly repository: UserRepositoryInterface;

    constructor(repository: UserRepositoryInterface) {
        this.repository = repository;
    }

    private async hashPassword(password: string) {
        const salt = await bcrypt.genSalt(this.#saltRounds);
        return bcrypt.hash(password, salt);
    }

    public async authenticate(email: string, password: string): Promise<[AuthResponse, User | null]> {
        try {
            const user = await this.repository.get({ email });
            const exists = user instanceof User;
            const auth = {
                email: exists,
                password: !!user && await user.checkPassword(password),
            };
            return [auth, auth.password && auth.email ? user || null : null];
        } catch (error: any) {
            return [{
                email: false,
                password: false,
            }, null];
        }
    }

    public async updatePassword(id: number, password: string) {
        const user = await this.get(id);
        if (!!user) {
            const hash = await this.hashPassword(password);
            user.password = hash;
            const amount = await this.repository.update(id, {
                password: hash,
                lastModified: user.lastModified
            });
            if (amount > 1) throw new CaseError('Mais de um usuário afetado');
            return !!amount;
        }
        return false;
    }

    public async get(id: number) {
        const user = await this.repository.get({ id });
        if (!user) throw new CaseError('Usuário não encontrado', Errors.NOT_FOUND);
        return user;
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

    public async update(id: number, data: UserUpdate) {
        const user = await this.get(id);
        const insertion = !!data.password ? {
            ...data,
            password: await this.hashPassword(data.password),
        } : data;
        await user.update(insertion);
        await this.repository.update(id, user.data);
        return user;
    }

}