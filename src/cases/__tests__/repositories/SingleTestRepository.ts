import { SessionInterface } from "../../../entities/Session";
import SingleEssay, { SingleEssayInterface } from "../../../entities/SingleEssay";
import { SingleEssayRepositoryInterface, SingleEssayInsertionInterface } from "../../SingleEssay";
import { FakeDB } from "./database";
import TestRepository from "./TestRepository";


export default class SingleEssayTestRepository extends TestRepository<SingleEssay, SingleEssayInterface> implements SingleEssayRepositoryInterface {

    constructor(db: FakeDB) {
        super(db, SingleEssay, 'singles');
    }

}



