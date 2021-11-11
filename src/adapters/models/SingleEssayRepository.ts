import { Knex } from "knex";
import { SingleEssayInsertionInterface, SingleEssayRepositoryInterface } from "../../cases/SingleEssayCase";
import SingleEssay, { SingleEssayInterface } from "../../entities/SingleEssay";
import { Context } from "../interfaces";
import Repository, { FieldsMap } from "./Repository";

export interface SingleEssayModel {
    id: number;
    theme_id: number;
    user_id: number;
    token: string;
    registration_date: Date;
    expiration: Date;
    sent_date?: Date;
    essay_id?: number;
}

export type SingleEssayServiceType = Knex.QueryBuilder<Partial<SingleEssayModel>, SingleEssayModel[]>;

export const SingleEssayService = (db: Knex): SingleEssayServiceType => db('single_essays');

const timeParser = (val: any) => !!val ? new Date(val) : val;

const fieldsMap: FieldsMap<SingleEssayModel, SingleEssayInterface> = [
    [['id', Number], ['id', Number]],
    [['theme_id', Number], ['theme', Number]],
    [['user_id', Number], ['student', Number]],
    [['token', String], ['token', String]],
    [['registration_date', timeParser], ['registrationDate', timeParser]],
    [['expiration', timeParser], ['expiration', timeParser]],
    [['sent_date', timeParser], ['sentDate', timeParser]],
    [['essay_id', Number], ['essay', Number]],
];

export default class SingleEssayRepository extends Repository<SingleEssayModel, SingleEssayInterface, SingleEssay> implements SingleEssayRepositoryInterface {
    protected readonly searchFields = [];
    protected readonly fieldsMap;
    protected readonly service;
    protected readonly entity;

    constructor(context: Context) {
        super(context);
        this.service = SingleEssayService;
        this.fieldsMap = fieldsMap;
        this.entity = SingleEssay;
    }
}