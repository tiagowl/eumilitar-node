import { Knex } from "knex";
import { EssayRepositoryInterface } from "../../cases/EssayCase";
import { EssayInvalidationCreationData, EssayInvalidationRepositoryInterface } from "../../cases/EssayInvalidationCase";
import EssayInvalidation, { EssayInvalidationInterface, Reason } from "../../entities/EssayInvalidation";
import { EssayRepository } from "./EssayRepository";
import { Context } from "../interfaces";
import Repository, { FieldsMap, prsr } from "./Repository";

export interface EssayInvalidationModel {
    id: number;
    corrector: number;
    essay: number;
    reason: Reason;
    invalidationDate: Date;
    comment?: string;
}

export const EssayInvalidationService = (db: Knex) => db<Partial<EssayInvalidationModel>, EssayInvalidationModel[]>('essay_invalidations');

const fieldsMap: FieldsMap<EssayInvalidationModel, EssayInvalidationInterface> = [
    [['id', prsr.number], ['id', prsr.number]],
    [['comment', prsr.string], ['comment', prsr.string]],
    [['corrector', prsr.number], ['corrector', prsr.number]],
    [['essay', prsr.number], ['essay', prsr.number]],
    [['invalidationDate', prsr.date], ['invalidationDate', prsr.date]],
    [['reason', prsr.string], ['reason', prsr.string]],
];

export default class EssayInvalidationRepository extends Repository<EssayInvalidationModel, EssayInvalidationInterface, EssayInvalidation> implements EssayInvalidationRepositoryInterface {
    public readonly essays: EssayRepositoryInterface;
    protected readonly fieldsMap;
    protected readonly service;
    protected readonly entity;
    protected readonly searchFields = [];

    constructor(context: Context) {
        super(context);
        this.essays = new EssayRepository(context);
        this.fieldsMap = fieldsMap;
        this.service = EssayInvalidationService;
        this.entity = EssayInvalidation;
    }
}