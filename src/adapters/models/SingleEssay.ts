import { Knex } from "knex";
import { SingleEssayInsertionInterface, SingleEssayRepositoryInterface } from "../../cases/SingleEssay";
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

export default class SingleEssayRepository extends Repository<SingleEssayModel, SingleEssayInterface> implements SingleEssayRepositoryInterface {
    constructor(context: Context) {
        super(fieldsMap, context, SingleEssayService);
    }

    public async create(data: SingleEssayInsertionInterface) {
        try {
            const parsed = await this.toDb(data);
            const [id] = await this.query.insert(parsed);
            const recovered = await this.query.where('id', id).first();
            if (!recovered) throw new Error('Erro ao salvar token');
            const recoveredParsed = await this.toEntity(recovered);
            return new SingleEssay(recoveredParsed);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao salvar token', status: 500 };
        }
    }

    public async get(filter: Partial<SingleEssayInterface>) {
        try {
            const parsed = await this.toDb(filter);
            const recovered = await this.query.where(parsed).first();
            if (!recovered) return;
            const recoverdParsed = await this.toEntity(recovered);
            return new SingleEssay(recoverdParsed);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao consultar token', status: 500 };
        }
    }

    public async delete(filter: Partial<SingleEssayInterface>) {
        try {
            const parsed = await this.toDb(filter);
            const deleted = await this.query.where(parsed).del();
            return deleted;
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao consultar token', status: 500 };
        }
    }
}