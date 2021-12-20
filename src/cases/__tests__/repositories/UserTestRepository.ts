import User, { UserInterface } from "../../../entities/User";
import { ChartFilter } from "../../interfaces";
import { UserRepositoryInterface, UserFilter, UserSavingData } from "../../UserCase";
import { FakeDB } from "./database";
import TestRepository from "./TestRepository";
import SubscriptionTestRepository from "./SubscriptionTestRepository";
import EssayTestRepository from "./EssayTestRepository";

export default class UserTestRepository extends TestRepository<User, UserInterface> implements UserRepositoryInterface {
    constructor(db: FakeDB) {
        super(db, User, 'users');
    }

    async all() {
        return this.database;
    }

    public async countActives(filter: ChartFilter<UserInterface>) {
        const { period, ...filterData } = filter;
        const subscriptions = new SubscriptionTestRepository(this.db);
        const filtered = await this.filter(filterData);
        const subscriptionsCount = await Promise.all(filtered.map(async (user) => {
            return subscriptions.count({ 'user': user.id });
        }));
        const actives = subscriptionsCount.filter(val => val > 0);
        return actives.length;
    }

    public async countSentEssays(filter: ChartFilter<UserInterface>) {
        const { period, ...filterData } = filter;
        const essays = new EssayTestRepository(this.db);
        const filtered = await this.filter(filterData);
        const essaysCount = await Promise.all(filtered.map(async user => {
            return essays.count({ 'student': user.id });
        }));
        const sent = essaysCount.filter(val => val > 0);
        return sent.length;
    }
}