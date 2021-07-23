import Subscription from "../entities/Subscription";
import { ProductRepositoryInterface } from "./ProductCase";
import { UserRepositoryInterface } from "./UserUseCase";
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

    public async create(data: SubscriptionCreationInterface) {
        const user = await this.repository.users.get({ email: data.email });
        if (!user) {
            const created = await this.repository.users.save({
                email: data.email,
                status: 'active',
                permission: 'esa&espcex',
                password: crypto.randomBytes(64).toString('base64').substring(0, 64),
                firstName: data.firstName,
                lastName: data.lastName,
                lastModified: new Date(),
                creationDate: new Date(),
            });
        }
    }
}