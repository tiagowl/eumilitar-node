import { Knex } from "knex";
import { EssayRepositoryInterface } from "../../cases/Essay";
import { EssayInvalidationCreationData, EssayInvalidationRepositoryInterface } from "../../cases/EssayInvalidation";
import EssayInvalidation, { EssayInvalidationInterface, Reason } from "../../entities/EssayInvalidation";
import { EssayRepository } from "./Essay";
import { Context } from "../interfaces";
import Repository from "./Repository";

export interface EssayInvalidationModel {
    id: number;
    corrector: number;
    essay: number;
    reason: Reason;
    invalidationDate: Date;
    comment?: string;
}

export const EssayInvalidationService = (db: Knex) => db<Partial<EssayInvalidationModel>, EssayInvalidationModel[]>('essay_invalidations');

export default class EssayInvalidationRepository extends Repository<EssayInvalidationModel, EssayInvalidationInterface, EssayInvalidation> implements EssayInvalidationRepositoryInterface {
    public readonly essays: EssayRepositoryInterface;

    constructor(context: Context) {
        super([], context, EssayInvalidationService, EssayInvalidation);
        this.essays = new EssayRepository(context);
    }
}