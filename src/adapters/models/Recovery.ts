import { Knex } from "knex";
import { RecoveryInsertionInterface, RecoveryRepositoryInterface } from "../../cases/Recovery";
import { UserRepositoryInterface } from "../../cases/UserUseCase";
import Recovery, { RecoveryInterface } from "../../entities/Recovery";
import { Context } from "../interfaces";
import Repository from "./Repository";
import UserRepository from "./User";

export interface RecoveryModel {
    selector: string;
    token: string;
    expires: Date;
    readonly id: number;
    user_id: number;
}

export const RecoveryService = (driver: Knex) => driver<Partial<RecoveryModel>, RecoveryModel[]>('password_reset');

export default class RecoveryRepository extends Repository<RecoveryModel, RecoveryInterface> implements RecoveryRepositoryInterface {
    public readonly users: UserRepositoryInterface;

    constructor(context: Context) {
        super([], context, RecoveryService);
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
}