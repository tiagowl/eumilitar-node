import Subscription, { SubscriptionInterface } from "../../../entities/Subscription";
import { ProductRepositoryInterface } from "../../Product";
import { SubscriptionRepositoryInterface, SubscriptionInsertionInterface } from "../../Subscription";
import { UserRepositoryInterface } from "../../User";
import { FakeDB } from "./database";
import ProductTestRepository from "./ProductTestRepository";
import TestRepository from "./TestRepository";
import UserTestRepository from "./UserTestRepository";



export default class SubscriptionTestRepository extends TestRepository<Subscription, SubscriptionInterface> implements SubscriptionRepositoryInterface {
    public users: UserRepositoryInterface;
    public products: ProductRepositoryInterface;

    constructor(db: FakeDB) {
        super(db, Subscription, 'subscriptions');
        this.users = new UserTestRepository(db);
        this.products = new ProductTestRepository(db);
    }
}
