import { Knex } from "knex";

interface UserModel {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    passwd: string;
    status: number;
    permission: number;
    date_created: Date;
    date_modified: Date;
}


export const UserService = (driver: Knex) => driver<UserModel>('users')