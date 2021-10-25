import { Knex } from "knex";
import { EssayRepositoryInterface } from "../../cases/Essay";
import { EssayInvalidationCreationData, EssayInvalidationRepositoryInterface } from "../../cases/EssayInvalidation";
import EssayInvalidation, { EssayInvalidationInterface, Reason } from "../../entities/EssayInvalidation";
import { EssayRepository } from "./Essay";
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
    [['id', prsr.nb], ['id', prsr.nb]],
    [['comment', prsr.st], ['comment', prsr.st]],
    [['corrector', prsr.nb], ['corrector', prsr.nb]],
    [['essay', prsr.nb], ['essay', prsr.nb]],
    [['invalidationDate', prsr.dt], ['invalidationDate', prsr.dt]],
    [['reason', prsr.st], ['reason', prsr.st]],
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