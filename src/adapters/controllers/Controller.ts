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

    public async validate(): Promise<Fields> {
        return this.schema.validate(this.data, {
            strict: true,
            abortEarly: false,
            stripUnknown: false,
            recursive: true,
        })
            .catch(async (errors: ValidationError) => {
                // tslint:disable-next-line
                console.log(errors)
                throw { errors: [errors.inner.map(error => ([error.path, error.message]))] };
            });
    }

}