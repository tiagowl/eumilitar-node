import { Knex } from "knex";
import { EssayRepositoryInterface } from "../../cases/EssayCase";
import { EssayInvalidationCreationData, EssayInvalidationRepositoryInterface } from "../../cases/EssayInvalidation";
import EssayInvalidation, { Reason } from "../../entities/EssayInvalidation";
import { EssayRepository } from "./Essay";
import { Logger } from 'winston';
import { Context } from "../interfaces";

export interface EssayInvalidationModel {
    id: number;
    corrector: number;
    essay: number;
    reason: Reason;
    invalidationDate: Date;
    comment?: string;
}

export const EssayInvalidationService = (driver: Knex) => driver<Partial<EssayInvalidationModel>, EssayInvalidationModel[]>('essay_invalidations');

export default class EssayInvalidationRepository implements EssayInvalidationRepositoryInterface {
    private driver: Knex;
    private logger: Logger;
    public essays: EssayRepositoryInterface;

    constructor(context: Context) {
        const { driver, logger } = context;
        this.driver = driver;
        this.essays = new EssayRepository(context);
        this.logger = logger;
    }

    public async create(data: EssayInvalidationCreationData) {
        const error = { message: 'Falha ao invalidar redação', status: 500 };
        const created = await EssayInvalidationService(this.driver).insert(data)
            .catch((err) => {
                this.logger.error(err);
                throw error;
            });
        if (created.length === 0) throw error;
        const invalidationData = await EssayInvalidationService(this.driver)
            .where('id', created[0]).first();
        if (!invalidationData) throw error;
        return new EssayInvalidation(invalidationData);
    }

    public async get(essayId: number) {
        const data = await EssayInvalidationService(this.driver)
            .where('essay', essayId).first()
            .catch((err) => {
                this.logger.error(err);
                throw { message: 'Falha ao consultar redação', status: 500 };
            });
        if (!data) throw { message: 'Invalidação não encontrada', status: 404 };
        return new EssayInvalidation(data);
    }
}