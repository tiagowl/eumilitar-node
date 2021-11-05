import Warning, { WarningInterface } from "../../../entities/Warning";
import TestRepository from "./TestRepository";
import { WarningRepositoryInterface } from '../../Warning';
import { FakeDB } from "./database";


export default class WarningTestRepository extends TestRepository<Warning, WarningInterface> implements WarningRepositoryInterface {
    constructor(db: FakeDB) {
        super(db, Warning, 'warnings');
    }
}