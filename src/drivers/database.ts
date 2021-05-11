import knex, { Knex } from "knex";
import { attachPaginate } from 'knex-paginate';

export default function connect(settings: Knex.Config): Knex {
    const db = knex(settings);
    attachPaginate();
    return db;
}