import Subscription, { SubscriptionInterface } from "../entities/Subscription";
import { ProductRepositoryInterface } from "./ProductCase";
import UserUseCase, { UserRepositoryInterface } from "./UserUseCase";
import crypto from 'crypto';
import { Course } from "../entities/Product";
import CaseError from "./Error";

export interface SubscriptionRepositoryInterface {
    readonly create: (data: SubscriptionInsertionInterface) => Promise<Subscription>;
    readonly filter: (filter: Partial<SubscriptionInterface>) => Promise<Subscription[]>;
    readonly update: (id: number, data: Partial<SubscriptionInterface>) => Promise<Subscription>;
    readonly users: UserRepositoryInterface;
    readonly products: ProductRepositoryInterface;
}

export interface SubscriptionCreationInterface {
    email: string;
    product: number;
    firstName: string;
    lastName: string;
    code: number;
}

export interface SubscriptionInsertionInterface {
    user: number;
    expiration: Date;
    registrationDate: Date;
    product: number;
    code: number;
    course: Course;
}

export default class SubscriptionCase {
    private readonly repository: SubscriptionRepositoryInterface;

    constructor(repository: SubscriptionRepositoryInterface) {
        this.repository = repository;
    }

    private async checkUser(data: SubscriptionCreationInterface) {
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

    public async exists(data: SubscriptionCreationInterface) {
        const subscription = await this.repository.filter({ code: data.code });
        return subscription.length > 0;
    }

    public async create(data: SubscriptionCreationInterface) {
        if (await this.exists(data)) return;
        const user = await this.checkUser(data);
        const product = await this.repository.products.get({ code: data.product });
        return this.repository.create({
            user: user.id,
            expiration: new Date(Date.now() + product.expirationTime),
            registrationDate: new Date(),
            product: product.id,
            code: data.code,
            course: product.course,
        });
    }

    public async cancel(code: number) {
        const [subscription] = await this.repository.filter({ code });
        if (!subscription) throw new CaseError('Inscrição não encontrada', 'not_found');
        return this.repository.update(subscription.id, { active: false });
    }

    public async filter(filter: Partial<SubscriptionInterface>) {
        return this.repository.filter(filter);
    }
}