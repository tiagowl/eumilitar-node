import * as yup from 'yup';
import WarningCase, { WarningCreation, WarningRepositoryInterface } from '../../cases/Warning';
import Warning from '../../entities/Warning';
import { Context } from '../interfaces';
import WarningRepository from '../models/Warning';
import Controller from './Controller';

const schema = yup.object().shape({
    title: yup.string().required('O campo "Título" é obrigatório')
        .max(200, 'Máximo de 200 caractéres no título'),
    message: yup.string().required('O campo "Mensagem" é obrigatório'),
});

export default class WarningController extends Controller {
    private readonly useCase: WarningCase;
    private readonly repository: WarningRepositoryInterface;

    constructor(context: Context) {
        super(context, schema);
        this.repository = new WarningRepository(context);
        this.useCase = new WarningCase(this.repository);
    }

    private async parseEntity(entity: Warning) {
        return { ...entity };
    }

    public async createOrUpdate(data: WarningCreation) {
        try {
            const validated = await this.validate(data);
            const created = await this.useCase.updateOrCreate(validated);
            return await this.parseEntity(created);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }
}