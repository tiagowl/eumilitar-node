import * as yup from 'yup';
import WarningCase, { WarningRepositoryInterface } from '../../cases/WarningCase';
import Warning from '../../entities/Warning';
import { Context } from '../interfaces';
import WarningRepository from '../models/WarningRepository';
import Controller from './Controller';

interface WarningCreation {
    title: string;
    active: boolean;
    message?: string;
    image?: Express.MulterS3.File;
}

const schema = yup.object().shape({
    title: yup.string()
        .max(200, 'Máximo de 200 caractéres no título')
        .when('active', {
            is: true,
            then: yup.string().required('O campo "Título" é obrigatório'),
            otherwise: yup.string().nullable().default(''),
        }),
    message: yup.string().when('active', {
        is: true,
        then: yup.string().when('image', {
            is: (val: any) => !!val,
            then: yup.string().nullable().default('').transform(() => ''),
            otherwise: yup.string().required('A mensagem é obrigatória'),
        }),
        otherwise: yup.string().nullable().default(''),
    }),
    image: yup.string().max(300).nullable(true).default(null),
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
            const validated = await this.validate({
                ...data,
                image: data.image?.path || data.image?.location,
            }, schema);
            const created = await this.useCase.updateOrCreate(validated);
            return await this.parseEntity(created);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async get() {
        try {
            const recovered = await this.useCase.get();
            if (!recovered) return;
            return await this.parseEntity(recovered);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }
}