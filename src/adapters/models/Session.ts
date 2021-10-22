import { Knex } from "knex";
import { SessionInsertionInterface, SessionRepositoryInterface } from "../../cases/Session";
import { UserRepositoryInterface } from "../../cases/User";
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

export const SessionService = (db: Knex) => db<Partial<SessionModel>, SessionModel[]>('login_sessions');

const fieldsMap: FieldsMap<SessionModel, SessionInterface> = [
    [['id', Number], ['id', Number]],
    [['user_id', Number], ['user', Number]],
    [['login_time', val => new Date(val)], ['loginTime', val => new Date(val)]],
    [['session_id', String], ['token', String]],
    [['user_agent', String], ['agent', String]],
];

export default class SessionRepository extends Repository<SessionModel, SessionInterface, Session> implements SessionRepositoryInterface {
    public readonly users: UserRepositoryInterface;

    constructor(context: Context) {
        super(fieldsMap, context, SessionService, Session);
        this.users = new UserRepository(context);
    }
}