import { Knex } from "knex";
import { ObjectSchema } from "yup";


export default class Controller<Fields> {
    protected data: Fields;
    protected schema: ObjectSchema<any>;
    protected driver: Knex;

    constructor(data: Fields, schema: ObjectSchema<any>, driver: Knex) {
        this.data = data;
        this.schema = schema;
        this.driver = driver;
    }

    public async isValid() {
        return this.schema.isValid(this.data);
    }

    public async validate() {
        return this.schema.validate(this.data);
    }

}