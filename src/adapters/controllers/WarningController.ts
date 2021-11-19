import * as yup from 'yup';
import WarningCase, { WarningCreation, WarningRepositoryInterface } from '../../cases/WarningCase';
import Warning from '../../entities/Warning';
import { Context } from '../interfaces';
import WarningRepository from '../models/WarningRepository';
import Controller from './Controller';

const schema = yup.object().shape({
    title: yup.string().required('O campo "Título" é obrigatório')
        .max(200, 'Máximo de 200 caractéres no título'),
    message: yup.string().required('O campo "Mensagem" é obrigatório'),
    active: yup.bool().required('É preciso informar se estará ativo ou não'),
});

export default class WarningController extends Controller {
    private readonly useCase: WarningCase;
    private readonly repository: WarningRepositoryInterface;

    constructor(context: Context) {
        super(context);
        this.repository = new WarningRepository(context);
        this.useCase = new WarningCase(this.repository);
    }

    private async parseEntity(entity: Warning) {
        return { ...entity };
    }

    public async createOrUpdate(data: WarningCreation) {
        try {
            const validated = await this.validate(data, schema);
            const created = await this.useCase.updateOrCreate(validated);
            return await this.parseEntity(created);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }

    public async get() {
        try {
            const recovered = await this.useCase.get();
            if (!recovered) return;
            return await this.parseEntity(recovered);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }
}