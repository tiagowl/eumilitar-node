import { Knex } from "knex";

export default class UseCase<Table> {
    private repository: Knex.QueryBuilder<Table>;

    constructor(repository: Knex.QueryBuilder<Table>) {
        this.repository = repository;
    }

    public findAll() {

    }

}