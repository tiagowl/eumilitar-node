import Subscription, { SubscriptionInterface } from "../entities/Subscription";
import ProductCase, { ProductRepositoryInterface } from "./ProductCase";
import UserUseCase, { UserRepositoryInterface } from "./UserCase";
import crypto from 'crypto';
import { Course } from "../entities/Product";
import CaseError, { Errors } from "./ErrorCase";
import { Chart, countMethod, createMethod, Filter, filterMethod, Paginated, Pagination, updateMethod } from "./interfaces";

export interface SubscriptionFilter extends Partial<SubscriptionInterface> {
    pagination?: Pagination<SubscriptionInterface>;
    search?: string;
}

export interface SubscriptionRepositoryInterface {
    readonly create: createMethod<SubscriptionInsertionInterface, Subscription>;
    readonly filter: filterMethod<Subscription, SubscriptionInterface>;
    readonly update: updateMethod<Subscription, SubscriptionInterface>;
    readonly count: countMethod<Subscription>;
    readonly users: UserRepositoryInterface;
    readonly products: ProductRepositoryInterface;
}

export interface SubscriptionAutoCreationInterface {
    email: string;
    product: number;
    firstName: string;
    lastName: string;
    code: number;
    phone?: string;
    approvedDate: number;
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
        const userCase = new UserUseCase(this.repository.users);
        if (!!user) return this.repository.users.update(user.id, {
            ...user.data,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            status: 'active',
            lastModified: new Date(),
        });
        return userCase.create({
            email: data.email,
            status: 'active',
            permission: 'student',
            password: crypto.randomBytes(16).toString('base64'),
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
        });
    }

    public async exists(data: SubscriptionAutoCreationInterface) {
        const subscription = (await this.repository.filter({ code: data.code })) as Subscription[];
        return subscription.length > 0;
    }

    public async autoCreate(data: SubscriptionAutoCreationInterface) {
        const [subscription] = await this.repository.filter({ code: data.code }) as (Subscription | undefined)[];
        const user = await this.checkUser(data);
        const product = await this.repository.products.get({ code: data.product });
        if (!product) throw new CaseError('Produto não econtrado', Errors.NOT_FOUND);
        const payload = {
            user: user.id,
            expiration: new Date(data.approvedDate + product.expirationTime),
            registrationDate: subscription?.registrationDate || new Date(),
            product: product.id,
            code: data.code,
            course: product.course,
            active: true,
        };
        
        return !!subscription
            ? this.repository.update(subscription.id, payload)
            : this.repository.create(payload);
    }

    public async cancel(code: number) {
        const [subscription] = (await this.repository.filter({ code })) as Subscription[];
        if (!subscription) throw new CaseError('Inscrição não encontrada', Errors.NOT_FOUND);
        return this.repository.update(subscription.id, { active: false });
    }

    public async filter(filter: Filter<SubscriptionInterface>) {
        return this.repository.filter(filter);
    }

    public async count(filter: SubscriptionFilter) {
        return this.repository.count(filter);
    }

    public async create(data: SubscriptionCreation) {
        const product = await this.repository.products.get({ id: data.product });
        if (!product) throw new CaseError('Produto não encontrado', Errors.NOT_FOUND);
        return this.repository.create({
            ...data,
            registrationDate: new Date(),
            course: product.course,
        });
    }

    public async update(id: number, data: SubscriptionCreation) {
        const product = await this.repository.products.get({ id: data.product });
        if (!product) throw new CaseError('Produto não encontrado', Errors.NOT_FOUND);
        return this.repository.update(id, {
            ...data,
            course: product.course,
        });
    }

    public async activeChart(filter: ChartFilter): Promise<Chart> {
        const { period = {}, ...filterData } = filter;
        const {
            start = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
            end = new Date()
        } = period;
        const months = Math.round((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
        const subscriptions = await this.repository.filter(filterData) as Subscription[];
        const data = new Array(months).fill(0)
            .map(async (_, index) => {
                const current = start.getMonth() + index + 1;
                const date = new Date(start.getFullYear(), current, 1);
                const month = date.getMonth();
                const year = date.getFullYear();
                const value = subscriptions.filter(({ expiration, registrationDate }) => {
                    const notExpired = expiration.getFullYear() > year || (expiration.getFullYear() === year && expiration.getMonth() >= month);
                    const alreadyCreated = registrationDate.getFullYear() < year || (registrationDate.getFullYear() === year && registrationDate.getMonth() <= month);
                    return notExpired && alreadyCreated;
                }).length;
                return {
                    key: `${month + 1}-${year}`,
                    value,
                };
            });
        return Promise.all(data);
    }

    public checkStatus(expiration: Date, registration: Date){
        const expirationDate = new Date(expiration);
        const registrationDate = new Date(registration);
        const today = new Date();

        if(expirationDate > registrationDate && expirationDate > today){
            return "registered";
        }else{
            return "complete"
        }
    }
}