import { Context } from "../interfaces";
import Controller from "./Controller";
import * as yup from 'yup';
import SingleEssayRepository from "../models/SingleEssayRepository";
import SingleEssayCase, { CheckEssayTokenInterface, SingleEssayCreation } from "../../cases/SingleEssayCase";
import { SingleEssayInterface } from "../../entities/SingleEssay";
import CaseError from "../../cases/ErrorCase";

const schema = yup.object().shape({
    theme: yup.number().required('O campo "tema" é obrigatório'),
    student: yup.number().required('É preciso informar o usuário'),
});

const checkSchema = yup.object().shape({
    token: yup.string().required('É preciso informar o token').length(64),
    student: yup.number().required('É preciso informar o usuário'),
});

export default class SingleEssayController extends Controller {
    private readonly repository: SingleEssayRepository;
    private readonly useCase: SingleEssayCase;

    constructor(context: Context) {
        super(context);
        this.repository = new SingleEssayRepository(context);
        const useCaseSettings = { expiration: context.settings.singleEssayExpiration * 60 * 60 * 1000 };
        this.useCase = new SingleEssayCase(this.repository, useCaseSettings);
    }

    private async parseEntity(entity: SingleEssayInterface) {
        return { ...entity, };
    }

    public async create(data: SingleEssayCreation) {
        try {
            const validated = await this.validate(data, schema);
            const created = await this.useCase.create(validated);
            return await this.parseEntity(created);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }

    public async check(data: CheckEssayTokenInterface) {
        try {
            const validated = await this.validate(data, checkSchema);
            const checked = await this.useCase.checkToken(validated);
            return await this.parseEntity(checked);
        } catch (error: any) {
            this.logger.error(error);
            if (error instanceof CaseError) throw { message: error.message, status: 400 };
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }
}