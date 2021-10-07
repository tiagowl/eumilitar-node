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

export default class RecoveryRepository extends Repository<RecoveryModel, RecoveryInterface> implements RecoveryRepositoryInterface {
    public readonly users: UserRepository;

    constructor(context: Context) {
        super(fieldsMap, context, RecoveryService);
        this.users = new UserRepository(context);
    }

    public async create(data: RecoveryInsertionInterface) {
        try {
            const parsed = await this.toDb(data);
            const [id] = await this.query.insert(parsed);
            if (!id) throw { message: 'Erro ao salvar token', status: 500 };
            const recovered = await this.query.where({ id }).first();
            if (!recovered) throw { message: 'Erro ao salvar token', status: 500 };
            const toEntity = await this.toEntity(recovered);
            return new Recovery(toEntity);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao salvar token no banco de dados', status: 500 };
        }
    }

    public async get(filter: Partial<RecoveryInterface>) {
        try {
            const parsed = await this.toDb(filter);
            const data = await this.query.where(parsed).first();
            if (!data) return null;
            const parsedData = await this.toEntity(data);
            return new Recovery(parsedData);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao consultar token no banco de dados', status: 500 };
        }
    }

    public async delete(filter: Partial<RecoveryInterface>) {
        try {
            const parsed = await this.toDb(filter);
            const deleted = await this.query.where(parsed).del();
            return deleted;
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro deletar token do banco de dados', status: 500 };
        }
    }
}