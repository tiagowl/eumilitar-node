import { Knex } from "knex";
import { RecoveryInsertionInterface, RecoveryRepositoryInterface } from "../../cases/Recovery";
import { UserRepositoryInterface } from "../../cases/User";
import Recovery, { RecoveryInterface } from "../../entities/Recovery";
import { Context } from "../interfaces";
import Repository, { FieldsMap } from "./Repository";
import UserRepository from "./User";

export interface RecoveryModel {
    selector: string;
    token: string;
    expires: Date;
    readonly id: number;
    user_id: number;
}

export const RecoveryService = (db: Knex) => db<Partial<RecoveryModel>, RecoveryModel[]>('password_reset');

const fieldsMap: FieldsMap<RecoveryModel, RecoveryInterface> = [
    [['expires', val => new Date(val)], ['expires', val => new Date(val)]],
    [['id', Number], ['id', Number]],
    [['selector', String], ['selector', String]],
    [['token', String], ['token', String]],
    [['user_id', Number], ['user', Number]],
];

export default class RecoveryRepository extends Repository<RecoveryModel, RecoveryInterface, Recovery> implements RecoveryRepositoryInterface {
    public readonly users: UserRepository;
    protected readonly fieldsMap;
    protected readonly service;
    protected readonly entity;
    protected readonly searchFields = [];

    constructor(context: Context) {
        super(context);
        this.users = new UserRepository(context);
        this.service = RecoveryService;
        this.entity = Recovery;
        this.fieldsMap = fieldsMap;
    }
}