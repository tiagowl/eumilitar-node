import faker from "faker";
import Session, { SessionInterface } from "../../../entities/Session";
import { SessionRepositoryInterface, SessionInsertionInterface } from "../../SessionCase";
import { UserRepositoryInterface } from "../../UserCase";
import { FakeDB } from "./database";
import TestRepository from "./TestRepository";
import UserTestRepository from "./UserTestRepository";



export default class SessionTestRepository extends TestRepository<Session, SessionInterface> implements SessionRepositoryInterface {
    public readonly users: UserRepositoryInterface;

    constructor(db: FakeDB) {
        super(db, Session, 'sessions');
        this.users = new UserTestRepository(db);
    }
}