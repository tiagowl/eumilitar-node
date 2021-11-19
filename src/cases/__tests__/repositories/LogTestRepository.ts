import Log, { LogInterface } from "../../../entities/Log";
import { Filter } from "../../interfaces";
import { LogFilter, LogRepositoryInterface } from "../../LogCase";
import { FakeDB } from "./database";
import TestRepository from "./TestRepository";


export default class LogTestRepository extends TestRepository<Log, LogInterface> implements LogRepositoryInterface {
    constructor(db: FakeDB) {
        super(db, Log, 'logs');
    }

    async filter(filter: Filter<LogFilter>) {
        return super.filter(filter as Filter<LogInterface>);
    }
}
