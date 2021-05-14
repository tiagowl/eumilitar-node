import EssayTheme from "../../entities/EssayTheme";
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
    courses: Course[];
}

export interface EssayThemeInput extends EssayThemeBaseInterface {
    file: Express.Multer.File;
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
    page?: number;
    size?: number;
    order?: keyof EssayThemeModel;
}

export interface EssayThemeList {
    pages: number;
    count: number;
    page: EssayThemeResponse[]
}

export const schema = yup.object({
    title: yup.string().required('O título é obrigatório'),
    helpText: yup.string().default(''),
    file: yup.string(),
    courses: yup.array(
        yup.string().matches(/^(esa|espcex)$/),
    ),
    startDate: yup.date().required().max(
        yup.ref('endDate'), 'A data de início deve ser anterior a data final'
    ),
    endDate: yup.date().required().min(
        yup.ref('startDate'), 'A data de início deve ser anterior a data final'
    ),
})

const filterFields = ['id', 'title', 'courses', 'startDate', 'endDate', 'lastModified']

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
            courses: [...theme.courses]
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
            const validatedPagination = {
                page: Number(pagination?.page || 1),
                size: Number(pagination?.size || 10),
                order: !!pagination?.order ? pagination?.order in filterFields ? pagination?.order : 'startDate' : 'startDate'
            }
            const page = await this.useCase.findAll(validatedPagination.page, validatedPagination?.size || 10, validatedPagination.order);
            const amount = await this.useCase.count();
            return {
                page: await Promise.all(page.map(async theme => (await this.parseEntity(theme)))),
                count: page.length,
                pages: Math.ceil(amount / validatedPagination.size),
            } as EssayThemeList
        } catch (error) {
            throw { message: 'Erro ao consultar temas' }
        }
    }

    public async update(id: number, rawData: EssayThemeInput) {
        try {
            const data = await this.validate({ ...rawData, file: rawData.file.path });
            const theme = await this.useCase.update(id, {
                ...data,
                courses: new Set(data.courses),
            })
            return this.parseEntity(theme);
        } catch (error) {
            throw { message: error.message || 'Erro ao atualizar tema' }
        }
    }

}