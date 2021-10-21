import faker from "faker";
import Recovery, { RecoveryInterface } from "../../../entities/Recovery";
import { RecoveryRepositoryInterface, RecoveryInsertionInterface } from "../../Recovery";
import { UserRepositoryInterface } from "../../User";
import { FakeDB } from "./database";
import TestRepository from "./TestRepository";
import UserTestRepository from "./UserTestRepository";



export default class RecoveryTestRespository extends TestRepository<Recovery, RecoveryInterface> implements RecoveryRepositoryInterface {
    public readonly users: UserRepositoryInterface;

    constructor(db: FakeDB) {
        super(db, Recovery, 'recoveries');
        this.users = new UserTestRepository(db);
    }

}

