import User, { UserInterface } from "../../../entities/User";
import { UserRepositoryInterface, UserFilter, UserSavingData } from "../../User";
import { FakeDB } from "./database";
import TestRepository from "./TestRepository";


export default class UserTestRepository extends TestRepository<User, UserInterface> implements UserRepositoryInterface {
    constructor(db: FakeDB) {
        super(db, User, 'users');
    }

    async all() {
        return this.database;
    }
}