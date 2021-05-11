import EssayTheme from "../../entities/EssayTheme";
import Controller from "./Controller";
import * as yup from 'yup';
import { Course } from '../../entities/EssayTheme';
import { Knex } from "knex";
import EssayThemeCase from "../../cases/EssayThemeCase";
import EssayThemeRepository, { EssayThemeModel } from '../models/EssayTheme';

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
    id: number;
    lastModified: Date;
}

export interface EssayThemeData extends EssayThemeBaseInterface {
    file: string;
}

export interface EssayThemePagination {
    page?: number;
    size?: number;
    order?: keyof EssayThemeModel;
}

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

    public async listAll(pagination?: EssayThemePagination) {
        return this.useCase.findAll(pagination?.page, pagination?.size, pagination?.order)
    }

}