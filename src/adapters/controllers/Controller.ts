import { Knex } from "knex";
import { ObjectSchema, ValidationError } from "yup";

type Validation<Data> = {
    data: Data | undefined;
    error: ValidationError | undefined;
}
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

    public async validate(): Promise<Validation<Fields>> {
        return this.schema.validate(this.data)
            .then(validated => ({ data: validated, error: undefined }))
            .catch(errors => ({ data: undefined, error: errors }));
    }

}