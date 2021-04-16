import { Knex } from "knex";

export interface TokenInterface {
    readonly token: string;
    readonly creationDate: Date;
    readonly user_id: number;
}

export interface TokenModel {
    session_id: string;
    login_time: string
    user_id: number;
}

export const TokenService = (driver: Knex) => driver('login_sessions');