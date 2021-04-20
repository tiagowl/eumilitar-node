import { Knex } from "knex";
import { ObjectSchema, ValidationError } from "yup";


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

    public async validate(): Promise<{ data: Fields | undefined, errors: string[] | undefined, isValid: boolean }> {
        return new Promise((accept) => {
            this.schema.validate(this.data)
                .then((data) => {
                    accept({ data, errors: undefined, isValid: true, })
                })
                .catch((error: ValidationError) => {
                    accept({ data: undefined, errors: error.errors, isValid: false })
                })
        })
    }

}