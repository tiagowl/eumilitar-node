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
    next?: number;
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

export default class EssayThemeController extends Controller<EssayThemeData> {
    private repository: EssayThemeRepository;
    private useCase: EssayThemeCase;

    constructor(driver: Knex) {
        super(schema, driver);
        this.repository = new EssayThemeRepository(driver);
        this.useCase = new EssayThemeCase(this.repository);
    }

    public async create(rawData: EssayThemeInput,): Promise<EssayThemeResponse> {
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
            const page = await this.useCase.findAll(pagination?.page || 1, pagination?.size || 10, pagination?.order || 'id');
            return {
                page: await Promise.all(page.map(async theme => ({
                    file: theme.file,
                    id: theme.id,
                    lastModified: theme.lastModified,
                    active: theme.active,
                    title: theme.title,
                    startDate: theme.startDate,
                    endDate: theme.endDate,
                    helpText: theme.helpText,
                    courses: [...theme.courses]
                }))),
                count: page.length,
            } as EssayThemeList
        } catch (error) {
            throw { message: 'Erro ao consultar temas' }
        }
    }

}