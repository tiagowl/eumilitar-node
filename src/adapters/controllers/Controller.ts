import { Knex } from "knex";
import { ObjectSchema, ValidationError } from "yup";


export interface ResponseError {
    message?: string;
    errors?: [string, string][];
}

export default class Controller<Fields> {
    protected schema: ObjectSchema<any>;
    protected driver: Knex;

    constructor(schema: ObjectSchema<any>, driver: Knex) {
        this.schema = schema;
        this.driver = driver;
    }

    public async isValid(data: Fields) {
        return this.schema.isValid(data);
    }

    public async validate<Data = any>(rawData: Data): Promise<Data> {
        return this.schema.validate(rawData, {
            strict: true,
            abortEarly: false,
            stripUnknown: true,
            recursive: true,
        }).then(data => this.schema.noUnknown().cast(data, { stripUnknown: true }))
            .catch(async (errors: ValidationError) => {
                throw {
                    message: errors.message,
                    errors: errors.inner.map(error => ([error.path, error.message])),
                };
            });
    }

}