import { Knex } from "knex";
import { CorrectionInsertionData, CorrectionRepositoryInterface } from "../../cases/Correction";
import { EssayRepositoryInterface } from "../../cases/EssayCase";
import { UserRepositoryInterface } from "../../cases/UserUseCase";
import { EssayRepository } from "./Essay";
import UserRepository from "./User";


export interface CorrectionModel extends CorrectionModelInsertionData {
    grading_id: number;
}

export interface CorrectionModelInsertionData {
    grading_comments: string;
    final_grading: number;
    essay_id: number;
    grading_date: Date;
    criteria1: string;
    criteria2: string;
    criteria3: string;
    criteria4: string;
    criteria5: string;
    criteria6: string;
    criteria7: string;
    criteria8: string;
    criteria9: string;
    criteria10: string;
    criteria11: string;
    criteria12: string;
    criteria13: string;
    criteria14: string;
}

interface Mapping {}

const fieldsMap = [
    { entity: [], model: [] },
    { entity: [], model: [] },
    { entity: [], model: [] },
    { entity: [], model: [] },
    { entity: [], model: [] },
    { entity: [], model: [] },
    { entity: [], model: [] },
    { entity: [], model: [] },
    { entity: [], model: [] },
    { entity: [], model: [] },
    { entity: [], model: [] },
    { entity: [], model: [] },
    { entity: [], model: [] },
    { entity: [], model: [] },
    { entity: [], model: [] },
    { entity: [], model: [] },
    { entity: [], model: [] },
    { entity: [], model: [] },
];

export const CorrectionModel = (driver: Knex) => driver<CorrectionModelInsertionData, CorrectionModel[]>('essay_grading');

export default class CorrectionRepository implements CorrectionRepositoryInterface {
    private driver: Knex;
    public users: UserRepositoryInterface;
    public essays: EssayRepositoryInterface;

    constructor(driver: Knex) {
        this.driver = driver;
        this.users = new UserRepository(driver);
        this.essays = new EssayRepository(driver);
    }

    public async create(data: CorrectionInsertionData) {

    }

}