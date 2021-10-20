import Subscription, { SubscriptionInterface } from "../../../entities/Subscription";
import { ProductRepositoryInterface } from "../../Product";
import { SubscriptionRepositoryInterface, SubscriptionInsertionInterface } from "../../Subscription";
import { UserRepositoryInterface } from "../../User";
import getDb from "./database";
import { ProductTestRepository } from "./ProductTestRepository";
import { UserTestRepository } from "./UserTestRepository";


const db = getDb();

export class SubscriptionTestRepository implements SubscriptionRepositoryInterface {
    private database: Subscription[];
    public users: UserRepositoryInterface;
    public products: ProductRepositoryInterface;

    constructor() {
        this.database = db.subscriptions;
        this.users = new UserTestRepository();
        this.products = new ProductTestRepository();
    }

    public async create(data: SubscriptionInsertionInterface) {
        const subscription = new Subscription({
            id: this.database.length,
            ...data,
        });
        this.database.push(subscription);
        return subscription;
    }

    public async filter(filter: Partial<SubscriptionInsertionInterface>) {
        const fields = Object.entries(filter) as [keyof SubscriptionInsertionInterface, number | Date][];
        if (!fields.length) return this.database;
        return this.database.filter(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ));
    }

    public async update(id: number, data: Partial<SubscriptionInterface>) {
        let subscription: Subscription;
        this.database = this.database.map((item) => {
            if (item.id === id) {
                Object.assign(item, data);
                subscription = item;
            }
            return item;
        });
        // @ts-ignore
        return subscription;
    }

    public async count(filter: Partial<SubscriptionInsertionInterface>) {
        const data = await this.filter(filter);
        return data.length;
    }
}
