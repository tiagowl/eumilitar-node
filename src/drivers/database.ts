import knex, { Knex } from "knex";

export default function connect(settings: Knex.Config): Knex {
    return knex(settings);
}