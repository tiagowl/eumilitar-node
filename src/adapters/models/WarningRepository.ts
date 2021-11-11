import { Knex } from "knex";
import { WarningRepositoryInterface } from "../../cases/WarningCase";
import Warning, { WarningInterface } from "../../entities/Warning";
import { Context } from "../interfaces";
import Repository, { FieldsMap, prsr } from "./Repository";

export interface WarningModel {
    readonly id: number;
    title: string;
    message: string;
    lastModified: Date;
    active: boolean;
}

export const WarningService = (db: Knex) => db<Partial<WarningModel>, WarningModel[]>('warnings');

const fieldsMap: FieldsMap<WarningModel, WarningInterface> = [
    [['id', prsr.nb], ['id', prsr.nb]],
    [['title', prsr.st], ['title', prsr.st]],
    [['message', prsr.st], ['message', prsr.st]],
    [['lastModified', prsr.dt], ['lastModified', prsr.dt]],
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