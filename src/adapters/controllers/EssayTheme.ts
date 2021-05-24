import EssayTheme, { EssayThemeInterface } from "../../entities/EssayTheme";
import Controller from "./Controller";
import * as yup from 'yup';
import { Course } from '../../entities/EssayTheme';
import { Knex } from "knex";
import EssayThemeCase from "../../cases/EssayThemeCase";
import EssayThemeRepository, { EssayThemeModel } from '../models/EssayTheme';

interface EssayThemeBaseInterface {
    title: string;
    startDate: Date;
    endDate: Date;
    helpText: string;
    deactivated: boolean;
    courses: Course[];
}

export interface EssayThemeInput extends EssayThemeBaseInterface {
    file: Express.Multer.File;
}

export interface EssayThemeUpdating extends EssayThemeBaseInterface {
    file?: Express.Multer.File;
}

export interface EssayThemeResponse extends EssayThemeBaseInterface {
    file: string;
    id?: number;
    lastModified: Date;
    active: boolean;
}

export interface EssayThemeData extends EssayThemeBaseInterface {
    file: string;
}

export interface EssayThemePagination {
    page?: string;
    size?: string;
    order?: keyof EssayThemeModel;
    active?: 'true' | 'false';
}

export interface EssayThemeList {
    pages: number;
    count: number;
    page: EssayThemeResponse[];
}

const baseSchema = {
    title: yup.string().required('O título é obrigatório'),
    helpText: yup.string().default(''),
    courses: yup.array(
        yup.string().matches(/^(esa|espcex)$/),
    ),
    startDate: yup.date().required().max(
        yup.ref('endDate'), 'A data de início deve ser anterior a data final'
    ),
    endDate: yup.date().required().min(
        yup.ref('startDate'), 'A data de início deve ser anterior a data final'
    ),
}

export const updatingSchema = yup.object({
    ...baseSchema,
    file: yup.string().notRequired(),
})

export const schema = yup.object({
    ...baseSchema,
    file: yup.string().required('O arquivo do tema é obrigatório'),
})

const toNumber = (data: string) => !!data ? Number(data) : undefined

const filterFields = ['id', 'title', 'courses', 'startDate', 'endDate', 'lastModified']

export const querySchema = yup.object({
    page: yup.number()
        .transform(toNumber)
        .default(1),
    size: yup.number()
        .transform(toNumber)
        .default(10),
    order: yup.string()
        .oneOf(filterFields)
        .default('id'),
    active: yup.mixed<boolean>()
        .transform(data => data === '1' ? true : data === '0' ? false : undefined)
        .default(undefined)
}).noUnknown()

export default class EssayThemeController extends Controller<EssayThemeData> {
    private repository: EssayThemeRepository;
    private useCase: EssayThemeCase;

    constructor(driver: Knex) {
        super(schema, driver);
        this.repository = new EssayThemeRepository(driver);
        this.useCase = new EssayThemeCase(this.repository);
    }

    private async parseEntity(theme: EssayTheme): Promise<EssayThemeResponse> {
        return {
            file: theme.file,
            id: theme.id,
            lastModified: theme.lastModified,
            active: theme.active,
            title: theme.title,
            startDate: theme.startDate,
            endDate: theme.endDate,
            helpText: theme.helpText,
            courses: [...theme.courses],
            deactivated: theme.deactivated,
        }
    }

    public async create(rawData: EssayThemeInput): Promise<EssayThemeResponse> {
        const data = await this.validate({ ...rawData, file: rawData.file.path });
        return this.useCase.create({
            ...data,
            courses: new Set(data.courses),
        })
            .then(theme => {
                return {
                    ...theme,
                    courses: [...theme.courses]
                } as EssayThemeResponse
            })
            .catch((error) => {
                throw { message: error.message || 'Erro ao salvar o tema' }
            })
    }

    public async listAll(pagination?: EssayThemePagination): Promise<EssayThemeList> {
        try {
            const data = await querySchema.validate(pagination).catch(() => querySchema.cast(undefined));
            const page = await this.useCase.findAll(data.page, data?.size || 10, data.order as keyof EssayThemeInterface, data.active);
            const amount = await this.useCase.count();
            return {
                page: await Promise.all(page.map(async theme => (await this.parseEntity(theme)))),
                count: page.length,
                pages: Math.ceil(amount / data.size),
            } as EssayThemeList
        } catch (error) {
            throw { message: 'Erro ao consultar temas' };
        }
    }

    public async update(id: number, rawData: EssayThemeUpdating) {
        try {
            this.schema = updatingSchema;
            const data = await this.validate({ ...rawData, file: rawData.file?.path || '' });
            const theme = await this.useCase.update(id, {
                ...data,
                courses: new Set(data.courses),
            })
            return this.parseEntity(theme);
        } catch (error) {
            throw { message: error.message || 'Erro ao atualizar tema' }
        }
    }

    public async deactivate(id: number) {
        try {
            const theme = await this.useCase.deactivate(id);
            return this.parseEntity(theme);
        } catch (error) {
            throw { message: error.message || 'Erro ao desativar tema' };
        }
    }

    public async get(filter: Partial<EssayThemeResponse>) {
        const theme = await this.useCase.get({ ...filter, courses: new Set(filter.courses) });
        if(!theme) return undefined;
        return this.parseEntity(new EssayTheme(theme));
    }

}