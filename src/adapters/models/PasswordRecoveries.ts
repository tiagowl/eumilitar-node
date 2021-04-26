import { Knex } from "knex";

export interface PasswordRecoveryInsert {
    selector: string;
    token: string;
    expires: Date;
    user_id: number;
}

export interface PasswordRecoveryModel {
    selector: string;
    token: string;
    expires: Date;
    readonly id: number;
    user_id: number;
}

export const PasswordRecoveryService = (driver: Knex) => driver<PasswordRecoveryInsert, PasswordRecoveryModel>('password_reset');