import Subscription from "../entities/Subscription";
import { ProductRepositoryInterface } from "./ProductCase";
import UserUseCase, { UserRepositoryInterface } from "./UserUseCase";
import crypto from 'crypto';

export interface SubscriptionRepositoryInterface {
    create: (data: any) => Promise<Subscription>;
    users: UserRepositoryInterface;
    products: ProductRepositoryInterface;
}

export interface SubscriptionCreationInterface {
    email: string;
    product: number;
    expiration: Date;
    transaction: string;
    firstName: string;
    lastName: string;
}

export default class SubscriptionCase {
    private repository: SubscriptionRepositoryInterface;

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

    public async create(data: SubscriptionCreationInterface) {
        const user = await this.checkUser(data);
    }
}