import { Knex } from "knex";
import { CorrectionInsertionData, CorrectionRepositoryInterface } from "../../cases/Correction";
import { EssayRepositoryInterface } from "../../cases/EssayCase";
import { UserRepositoryInterface } from "../../cases/UserUseCase";
import Correction, { CorrectionInterface } from "../../entities/Correction";
import { EssayRepository } from "./Essay";
import UserRepository from "./User";
import { Context } from "../interfaces";
import Repository, { FieldsMap } from "./Repository";

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

const fieldsMap: FieldsMap<CorrectionModel, CorrectionInterface> = [
    [['grading_id', Number], ['id', Number],],
    [['essay_id', Number], ['essay', Number],],
    [['grading_date', value => new Date(value)], ['correctionDate', value => new Date(value)]],
    [['criteria1', String], ['isReadable', String],],
    [['criteria2', String], ['hasMarginSpacing', String],],
    [['criteria3', String], ['obeyedMargins', String],],
    [['criteria4', String], ['erased', String],],
    [['criteria5', String], ['orthography', String],],
    [['criteria6', String], ['accentuation', String],],
    [['criteria7', String], ['agreement', String],],
    [['criteria8', String], ['repeated', String],],
    [['criteria9', String], ['veryShortSentences', String],],
    [['criteria10', String], ['understoodTheme', String],],
    [['criteria11', String], ['followedGenre', String],],
    [['criteria12', String], ['cohesion', String],],
    [['criteria13', String], ['organized', String],],
    [['criteria14', String], ['conclusion', String],],
    [['grading_comments', String], ['comment', String],],
    [['final_grading', Number], ['points', Number],],
];

export const CorrectionService = (db: Knex) => db<Partial<CorrectionModelInsertionData>, CorrectionModel[]>('essay_grading');

export default class CorrectionRepository extends Repository<CorrectionModel, CorrectionInterface> implements CorrectionRepositoryInterface {
    public readonly users: UserRepositoryInterface;
    public readonly essays: EssayRepositoryInterface;

    constructor(context: Context) {
        super(fieldsMap, context, CorrectionService);
        this.users = new UserRepository(context);
        this.essays = new EssayRepository(context);
    }

    public async create(data: CorrectionInsertionData) {
        const parsed = await this.toDb(data);
        const error = { message: 'Erro ao salvar correção', status: 500 };
        const [id] = await this.query.insert(parsed)
            .catch((err: Error) => {
                this.logger.error(err);
                throw error;
            });
        if (typeof id !== 'number') throw error;
        const savedData = await this.query.where('grading_id', id)
            .first().catch((err) => {
                this.logger.error(err);
                throw error;
            });
        if (!savedData) throw error;
        return new Correction(await this.toEntity(savedData) as CorrectionInterface);
    }

    public async get(filter: Partial<CorrectionInterface>) {
        const parsed = await this.toDb(filter);
        const data = await this.query.where(parsed)
            .first().catch((error) => {
                this.logger.error(error);
                throw { message: 'Erro ao consultar correção no banco de dados', status: 500 };
            });
        if (!data) throw { message: 'Correção não encontrada', status: 404 };
        const correctionData = await this.toEntity(data) as CorrectionInterface;
        return new Correction(correctionData);
    }

}