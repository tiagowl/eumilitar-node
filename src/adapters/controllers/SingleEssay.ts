import { Context } from "../interfaces";
import Controller from "./Controller";
import * as yup from 'yup';
import SingleEssayRepository from "../models/SingleEssay";
import SingleEssayCase, { SingleEssayCreation } from "../../cases/SingleEssay";
import { SingleEssayInterface } from "../../entities/SingleEssay";

const schema = yup.object().shape({
    theme: yup.number().required('Este campo é obrigatório'),
    student: yup.number().required('Este campo é obrigatório'),
});

export default class SingleEssayController extends Controller<any> {
    private readonly repository: SingleEssayRepository;
    private readonly useCase: SingleEssayCase;

    constructor(context: Context) {
        super(context, schema);
        this.repository = new SingleEssayRepository(context);
        this.useCase = new SingleEssayCase(this.repository, { expiration: 60 });
    }

    private async parseEntity(entity: SingleEssayInterface) {
        return {
            ...entity,
        };
    }

    public async create(data: SingleEssayCreation) {
        try {
            const validated = await this.validate(data);
            const created = await this.useCase.create(validated);
            return await this.parseEntity(created);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }
}