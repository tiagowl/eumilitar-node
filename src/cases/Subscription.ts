import Subscription, { SubscriptionInterface } from "../entities/Subscription";
import ProductCase, { ProductRepositoryInterface } from "./ProductCase";
import UserUseCase, { UserRepositoryInterface } from "./UserUseCase";
import crypto from 'crypto';
import { Course } from "../entities/Product";
import CaseError from "./Error";
import { Paginated, Pagination } from "./interfaces";

export interface SubscriptionFilter extends Partial<SubscriptionInterface> {
    pagination?: Pagination<SubscriptionInterface>;
    search?: string;
}

export interface SubscriptionRepositoryInterface {
    readonly create: (data: SubscriptionInsertionInterface) => Promise<Subscription>;
    readonly filter: (filter: SubscriptionFilter) => Promise<Subscription[]>;
    readonly update: (id: number, data: Partial<SubscriptionInterface>) => Promise<Subscription>;
    readonly count: (filter: SubscriptionFilter) => Promise<number>;
    readonly users: UserRepositoryInterface;
    readonly products: ProductRepositoryInterface;
}

export interface SubscriptionAutoCreationInterface {
    email: string;
    product: number;
    firstName: string;
    lastName: string;
    code: number;
}

export interface SubscriptionCreation {
    user: number;
    expiration: Date;
    product: number;
    code?: number;
    active: boolean;
}

export interface SubscriptionInsertionInterface {
    user: number;
    expiration: Date;
    registrationDate: Date;
    active: boolean;
    product: number;
    code?: number;
    course: Course;
}

export type Chart = {
    key: string;
    value: number;
}[];

export interface ChartFilter extends Partial<SubscriptionInterface> {
    period?: {
        start?: Date;
        end?: Date;
    };
}

export default class SubscriptionCase {
    private readonly repository: SubscriptionRepositoryInterface;

    constructor(repository: SubscriptionRepositoryInterface) {
        this.repository = repository;
    }

    private async checkUser(data: SubscriptionAutoCreationInterface) {
        const user = await this.repository.users.get({ email: data.email });
        if (!!user) return user;
        const userCase = new UserUseCase(this.repository.users);
        return userCase.create({
            email: data.email,
            status: 'active',
            permission: 'student',
            password: crypto.randomBytes(16).toString('base64'),
            firstName: data.firstName,
            lastName: data.lastName,
        });
    }

    public async exists(data: SubscriptionAutoCreationInterface) {
        const subscription = (await this.repository.filter(data)) as Subscription[];
        return subscription.length > 0;
    }

    public async autoCreate(data: SubscriptionAutoCreationInterface) {
        if (await this.exists(data)) return;
        const user = await this.checkUser(data);
        const products = new ProductCase(this.repository.products);
        const product = await products.get({ code: data.product });
        return this.repository.create({
            user: user.id,
            expiration: new Date(Date.now() + product.expirationTime),
            registrationDate: new Date(),
            product: product.id,
            code: data.code,
            course: product.course,
            active: true,
        });
    }

    public async cancel(code: number) {
        const [subscription] = (await this.repository.filter({ code })) as Subscription[];
        if (!subscription) throw new CaseError('Inscrição não encontrada', 'not_found');
        return this.repository.update(subscription.id, { active: false });
    }

    public async filter(filter: SubscriptionFilter) {
        return this.repository.filter(filter);
    }

    public async count(filter: SubscriptionFilter) {
        return this.repository.count(filter);
    }

    public async create(data: SubscriptionCreation) {
        const product = await this.repository.products.get({ id: data.product });
        return this.repository.create({
            ...data,
            registrationDate: new Date(),
            course: product.course,
        });
    }

    public async update(id: number, data: SubscriptionCreation) {
        const product = await this.repository.products.get({ id: data.product });
        return this.repository.update(id, {
            ...data,
            course: product.course,
        });
    }

    public async activeChart(filter: ChartFilter): Promise<Chart> {
        const { period, ...filterData } = filter;
        const start = period?.start || new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000);
        const end = period?.end || new Date();
        const months = (end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000);
        const subscriptions = await this.repository.filter(filterData);
        const data = new Array(months).fill(0)
            .map(async (_, index) => {
                const month = start.getMonth() + index;
                const year = start.getFullYear();
                const date = new Date(0);
                date.setFullYear(year);
                date.setMonth(month);
                const value = subscriptions.filter(({ expiration, registrationDate }) => {
                    const notExpired = expiration.getFullYear() <= date.getFullYear() && expiration.getMonth() <= date.getMonth();
                    const awreadyCreated = registrationDate.getFullYear() >= date.getFullYear() && registrationDate.getMonth() >= date.getMonth();
                    return notExpired && awreadyCreated;
                }).length;
                return {
                    key: `${date.getMonth() + 1}-${date.getFullYear()}`,
                    value,
                };
            });
        return Promise.all(data);
    }
}