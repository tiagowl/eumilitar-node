import { Knex } from "knex";
import { WarningRepositoryInterface } from "../../cases/WarningCase";
import Warning, { WarningInterface } from "../../entities/Warning";
import { Context } from "../interfaces";
import Repository, { FieldsMap, prsr } from "./Repository";

export interface WarningModel {
    readonly id: number;
    title: string;
    lastModified: Date;
    active: boolean;
    message?: string;
    image?: string;
}

export const WarningService = (db: Knex) => db<Partial<WarningModel>, WarningModel[]>('warnings');

const fieldsMap: FieldsMap<WarningModel, WarningInterface> = [
    [['id', prsr.number], ['id', prsr.number]],
    [['title', prsr.string], ['title', prsr.string]],
    [['message', prsr.string], ['message', prsr.string]],
    [['image', prsr.string], ['image', prsr.string]],
    [['lastModified', prsr.date], ['lastModified', prsr.date]],
    [['active', Boolean], ['active', Boolean]]
];

export default class WarningRepository extends Repository<WarningModel, WarningInterface, Warning> implements WarningRepositoryInterface {
    protected readonly entity = Warning;
    protected readonly fieldsMap = fieldsMap;
    protected readonly searchFields = [];
    protected readonly service = WarningService;

    constructor(context: Context) {
        super(context);
    }
}