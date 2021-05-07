import EssayTheme from "../../entities/EssayTheme";
import Controller from "./Controller";
import * as yup from 'yup';
import { Course } from '../../entities/EssayTheme';
import { Knex } from "knex";
import EssayThemeCase from "../../cases/EssayThemeCase";
import EssayThemeRepository from '../models/EssayTheme';

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

interface EssayThemeData extends EssayThemeBaseInterface {
    file: string;
}

export default class EssayThemeController extends Controller<EssayThemeData> {
    private repository: EssayThemeRepository;
    private useCase: EssayThemeCase;

    constructor(data: EssayThemeInput, driver: Knex) {
        super({ ...data, file: data.file.path }, schema, driver);
        this.repository = new EssayThemeRepository(driver);
        this.useCase = new EssayThemeCase(this.repository);
    }

    public async create(): Promise<EssayThemeResponse> {
        const data = await this.validate();
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
            .catch(() => {
                throw { message: 'Erro ao salvar o tema' }
            })
    }

}