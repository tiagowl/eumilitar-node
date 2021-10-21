import Correction, { CorrectionInterface } from "../../../entities/Correction";
import { CorrectionRepositoryInterface, CorrectionInsertionData, CorrectionBase } from "../../Correction";
import { EssayRepositoryInterface } from "../../Essay";
import { UserRepositoryInterface } from "../../User";
import { FakeDB } from "./database";
import EssayTestRepository from "./EssayTestRepository";
import TestRepository from "./TestRepository";
import UserTestRepository from "./UserTestRepository";


export default class CorrectionTestRepository extends TestRepository<Correction, CorrectionInterface> implements CorrectionRepositoryInterface {
    users: UserRepositoryInterface;
    essays: EssayRepositoryInterface;

    constructor(db: FakeDB) {
        super(db, Correction, 'corrections');
        this.users = new UserTestRepository(db);
        this.essays = new EssayTestRepository(db);
    }
}