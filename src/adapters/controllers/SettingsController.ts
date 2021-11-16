import SettingsCase, { SettingsCreation } from "../../cases/SettingsCase";
import Settings from "../../entities/Settings";
import { Context } from "../interfaces";
import SettingsRepository from "../models/SettingsRepository";
import Controller from "./Controller";
import * as yup from 'yup';

const schema = yup.object().shape({
    reviewExpiration: yup.number().required('O campo "Expiração da avaliação" é obrigatório').min(0),
});

export default class SettingsController extends Controller {
    private readonly repository: SettingsRepository;
    private readonly useCase: SettingsCase;

    constructor(context: Context) {
        super(context);
        this.repository = new SettingsRepository(context);
        this.useCase = new SettingsCase(this.repository);
    }

    private async parseEntity(entity: Settings) {
        return { ...entity };
    }

    public async updateOrCreate(data: SettingsCreation) {
        try {
            const validated = await this.validate(data, schema);
            const created = await this.useCase.updateOrCreate(validated);
            return await this.parseEntity(created);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }
}