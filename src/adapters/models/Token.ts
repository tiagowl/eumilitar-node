import { Knex } from "knex";


export interface TokenModel {
    session_id: string;
    login_time: Date;
    user_id: number;
    user_agent: string | undefined;
}

export const TokenService = (driver: Knex) => driver<TokenModel>('login_sessions');