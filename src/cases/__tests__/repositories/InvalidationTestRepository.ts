import EssayInvalidation, { EssayInvalidationInterface } from "../../../entities/EssayInvalidation";
import { EssayRepositoryInterface, EssayInvalidationData } from "../../EssayCase";
import { EssayInvalidationRepositoryInterface } from "../../EssayInvalidationCase";
import { FakeDB } from "./database";
import EssayTestRepository from "./EssayTestRepository";
import TestRepository from "./TestRepository";


export default class EssayInvalidationTestRepository extends TestRepository<EssayInvalidation, EssayInvalidationInterface> implements EssayInvalidationRepositoryInterface {
    public essays: EssayRepositoryInterface;

    constructor(db: FakeDB) {
        super(db, EssayInvalidation, 'essayInvalidations');
        this.essays = new EssayTestRepository(db);
    }
}
