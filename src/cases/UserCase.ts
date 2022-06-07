import User, { AccountStatus, AccountPermission, UserInterface, UserData, Permissions } from "../entities/User";
import bcrypt from 'bcrypt';
import knex from "knex";
import CaseError, { Errors } from "./ErrorCase";
import { ChartFilter, createMethod, Filter, filterMethod, getMethod, Paginated, Pagination, updateMethod } from "./interfaces";

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
    permissions?: Set<Permissions>;
    phone?: string;
}

export type UserUpdate = {
    firstName: string;
    lastName: string;
    email?: string;
    status?: AccountStatus;
    permission?: AccountPermission;
    permissions?: Set<Permissions>;
    password?: string;
    phone?: string;
    file?: string;
};

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
    readonly get: getMethod<User, UserInterface>;
    readonly filter: filterMethod<User, UserInterface>;
    readonly update: updateMethod<User, UserData>;
    readonly create: createMethod<UserSavingData, User>;
    readonly countActives: (filter: ChartFilter<UserInterface>) => Promise<number>;
    readonly countSentEssays: (filter: ChartFilter<UserInterface>) => Promise<number>;
    readonly countEssaySentByUser: (filter: ChartFilter<UserInterface>) => Promise<{
        fullName: string
        phone?: string;
        email: string;
        sentEssays: number;
    }[]>;
}

export default class UserUseCase {
    readonly #saltRounds: number = 10;
    private readonly repository: UserRepositoryInterface;

    constructor(repository: UserRepositoryInterface) {
        this.repository = repository;
    }

    public async availableSends(userId: number){
        const sends = await this.repository
    }

    private async hashPassword(password: string) {
        const salt = await bcrypt.genSalt(this.#saltRounds);
        return bcrypt.hash(password, salt);
    }

    public async authenticate(email: string, password: string): Promise<[AuthResponse, User | null]> {
        const user = await this.repository.get({ email });
        const auth = {
            email: !!user,
            password: !!user && await user.checkPassword(password),
        };
        return [auth, auth.password && auth.email ? user || null : null];
    }

    public async updatePassword(id: number, password: string) {
        const user = await this.get(id);
        if (!user) throw new CaseError('Usuário não encontrado', Errors.NOT_FOUND);
        const hash = await this.hashPassword(password);
        user.password = hash;
        const updated = await this.repository.update(id, {
            password: hash,
            lastModified: user.lastModified
        });
        return updated;
    }

    public async get(id: number) {
        const user = await this.repository.get({ id });
        if (!user) throw new CaseError('Usuário não encontrado', Errors.NOT_FOUND);
        return user;
    }

    public async filter(filter: Filter<UserInterface> = {}) {
        return this.repository.filter(filter);
    }

    public async create(data: UserCreation) {
        if (data.permission === 'admin' && !data.permissions) {
            throw new CaseError('É preciso informar as permissões', Errors.INVALID);
        }
        console.log(`Email criação: ${data.email}`);
        return this.repository.create({
            ...data,
            password: await this.hashPassword(data.password),
            lastModified: new Date(),
            creationDate: new Date(),
        });
    }

    public async update(id: number, data: UserUpdate) {
        if (data.permission === 'admin' && 'permissions' in data && !data.permissions) {
            throw new CaseError('É preciso informar as permissões', Errors.INVALID);
        }
        const user = await this.get(id);
        const insertion = !!data.password ? {
            ...data,
            permissions: user.permissions,
            avatar_url: data?.file,
            password: await this.hashPassword(data.password),
        } : {
            ...data,
            permissions: user.permissions,
            avatar_url: data?.file
        };
        await user.update(insertion);
        await this.repository.update(id, user.data);
        return user;
    }

    public async sentEssaysChart(filter: ChartFilter<UserInterface>) {
        const { period = {}, ...filterData } = filter;
        const {
            start = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
            end = new Date()
        } = period;
        const months = Math.round((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
        const chartPromise = Array.from({ length: months }, async (_, index) => {
            const current = start.getMonth() + index + 1;
            const startMonth = new Date(start.getFullYear(), current, 1);
            const endMonth = new Date(start.getFullYear(), current + 1, -1);
            const currentFilter = {
                period: { start: startMonth, end: endMonth },
                ...filterData,
            };
            const sentEssays = await this.repository.countSentEssays(currentFilter);
            const actives = await this.repository.countActives(currentFilter);
            return {
                key: `${startMonth.getMonth() + 1}-${startMonth.getFullYear()}`,
                value: (sentEssays / actives),
            };
        });
        return Promise.all(chartPromise);
    }

    public async countEssaySentByUser(filter: ChartFilter<UserInterface>) {
        const { period = {}, ...filterData } = filter;
        const {
            start = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
            end = new Date()
        } = period;
        return this.repository.countEssaySentByUser({ ...filterData, period: { start, end } });
    }

    public async hasPermissions(user: User, permissions: Permissions[]) {
        return await permissions.reduce(async (resultPromise, permission) => {
            const result = await resultPromise;
            const setPermissions = new Set(user.permissions);
            return setPermissions.has(permission) && result;
        }, Promise.resolve(true) as Promise<boolean>);
    }

}
