import { Knex } from "knex";
import { CorrectionInsertionData, CorrectionRepositoryInterface } from "../../cases/Correction";
import { EssayRepositoryInterface } from "../../cases/EssayCase";
import { UserRepositoryInterface } from "../../cases/UserUseCase";
import Correction, { CorrectionInterface } from "../../entities/Correction";
import { EssayRepository } from "./Essay";
import UserRepository from "./User";
import { Logger } from 'winston';
import { Context } from "../interfaces";


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

type Parser = (value: any) => any;

interface Mapping {
    entity: [keyof CorrectionInterface, Parser];
    model: [keyof CorrectionModel, Parser];
}

const fieldsMap: Mapping[] = [
    { entity: ['id', Number], model: ['grading_id', Number] },
    { entity: ['essay', Number], model: ['essay_id', Number] },
    { entity: ['correctionDate', value => new Date(value)], model: ['grading_date', value => new Date(value)] },
    { entity: ['isReadable', String], model: ['criteria1', String] },
    { entity: ['hasMarginSpacing', String], model: ['criteria2', String] },
    { entity: ['obeyedMargins', String], model: ['criteria3', String] },
    { entity: ['erased', String], model: ['criteria4', String] },
    { entity: ['orthography', String], model: ['criteria5', String] },
    { entity: ['accentuation', String], model: ['criteria6', String] },
    { entity: ['agreement', String], model: ['criteria7', String] },
    { entity: ['repeated', String], model: ['criteria8', String] },
    { entity: ['veryShortSentences', String], model: ['criteria9', String] },
    { entity: ['understoodTheme', String], model: ['criteria10', String] },
    { entity: ['followedGenre', String], model: ['criteria11', String] },
    { entity: ['cohesion', String], model: ['criteria12', String] },
    { entity: ['organized', String], model: ['criteria13', String] },
    { entity: ['conclusion', String], model: ['criteria14', String] },
    { entity: ['comment', String], model: ['grading_comments', String] },
    { entity: ['points', Number], model: ['final_grading', Number] },
];

export const CorrectionService = (driver: Knex) => driver<CorrectionModelInsertionData, CorrectionModel[]>('essay_grading');

export default class CorrectionRepository implements CorrectionRepositoryInterface {
    private driver: Knex;
    private logger: Logger;
    public users: UserRepositoryInterface;
    public essays: EssayRepositoryInterface;

    constructor(context: Context) {
        const { driver, logger } = context;
        this.driver = driver;
        this.users = new UserRepository(driver, logger);
        this.essays = new EssayRepository(context);
        this.logger = logger;
    }

    private async parseToDb(data: Partial<CorrectionInterface>): Promise<Partial<CorrectionModel>> {
        const fields = Object.entries(data) as [keyof CorrectionInterface, any][];
        return Object.fromEntries(fields.map(([key, value]) => {
            const transformer = fieldsMap.find(item => item.entity[0] === key);
            if (!transformer) throw { message: `Campo "${key}" inválido`, status: 400 };
            const [name, parser] = transformer.model;
            return [name, parser(value)];
        })) as Partial<CorrectionModel>;
    }

    private async parseFromDB(data: Partial<CorrectionModel>): Promise<Partial<CorrectionInterface>> {
        const fields = Object.entries(data) as [keyof CorrectionModel, any][];
        return Object.fromEntries(fields.map(([key, value]) => {
            const transformer = fieldsMap.find(item => item.model[0] === key);
            if (!transformer) throw { message: `Campo "${key}" inválido`, status: 400 };
            const [name, parser] = transformer.entity;
            return [name, parser(value)];
        })) as Partial<CorrectionInterface>;
    }

    public async create(data: CorrectionInsertionData) {
        const parsed = await this.parseToDb(data);
        const error = { message: 'Erro ao salvar correção', status: 500 };
        const [id] = await CorrectionService(this.driver).insert(parsed)
            .catch((err: Error) => {
                this.logger.error(err);
                throw error;
            });
        if (typeof id !== 'number') throw error;
        const savedData = await CorrectionService(this.driver).where('grading_id', id)
            .first().catch((err) => {
                this.logger.error(err);
                throw error;
            });
        if (!savedData) throw error;
        return new Correction(await this.parseFromDB(savedData) as CorrectionInterface);
    }

    public async get(filter: Partial<CorrectionInterface>) {
        const parsed = await this.parseToDb(filter);
        const data = await CorrectionService(this.driver).where(parsed)
            .first().catch((error) => {
                this.logger.error(error);
                throw { message: 'Erro ao consultar banco de dados', status: 500 };
            });
        if (!data) throw { message: 'Correção não encontrada', status: 404 };
        const correctionData = await this.parseFromDB(data) as CorrectionInterface;
        return new Correction(correctionData);
    }

}