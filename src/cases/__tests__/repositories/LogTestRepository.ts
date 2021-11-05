import Log, { LogInterface } from "../../../entities/Log";
import { LogRepositoryInterface } from "../../Log";
import { FakeDB } from "./database";
import TestRepository from "./TestRepository";


export default class LogTestRepository extends TestRepository<Log, LogInterface> implements LogRepositoryInterface {
    constructor(db: FakeDB) {
        super(db, Log, 'logs');
    }
}
