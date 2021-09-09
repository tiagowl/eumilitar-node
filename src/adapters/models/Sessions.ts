import { Knex } from "knex";
import { SessionInsertionInterface, SessionRepositoryInterface } from "../../cases/Session";
import { UserRepositoryInterface } from "../../cases/UserUseCase";
import Session, { SessionInterface } from "../../entities/Session";
import { Context } from "../interfaces";
import Repository, { FieldsMap } from "./Repository";
import UserRepository from "./User";

export interface SessionModel {
    id: number;
    session_id: string;
    login_time: Date;
    user_id: number;
    user_agent: string | undefined;
}

export const SessionService = (driver: Knex) => driver<Partial<SessionModel>, SessionModel[]>('login_sessions');

const fieldsMap: FieldsMap<SessionModel, SessionInterface> = [
    [['id', Number], ['id', Number]],
    [['user_id', Number], ['user', Number]],
    [['login_time', val => new Date(val)], ['loginTime', val => new Date(val)]],
    [['session_id', String], ['token', String]],
    [['user_agent', String], ['agent', String]],
];

export default class SessionRepository extends Repository<SessionModel, SessionInterface> implements SessionRepositoryInterface {
    public readonly users: UserRepositoryInterface;

    constructor(context: Context) {
        super(fieldsMap, context, SessionService);
        this.users = new UserRepository(context);
    }

    public async create(data: SessionInsertionInterface) {
        try {
            const parsed = await this.toDb(data);
            const [id] = await this.query.insert(parsed);
            if (!id) throw new Error('Erro ao salvar token');
            const recovered = await this.query.where('id', id).first();
            if (!recovered) throw new Error('Erro ao salvar token');
            const parsedData = await this.toEntity(recovered);
            return new Session(parsedData);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao gravar token no banco de dados', status: 500 };
        }
    }
}