import { Knex } from "knex";
import Essay, { EssayInterface, Status } from "../../entities/Essay";
import Controller from "./Controller";
import * as yup from 'yup';
import { EssayRepository } from "../models/Essay";
import EssayCase, { EssayPagination } from "../../cases/EssayCase";
import { Course } from "../../entities/EssayTheme";
import EssayThemeController, { EssayThemeResponse } from "./EssayTheme";

export interface EssayInput {
    file: Express.Multer.File;
    student: number;
    course: Course;
}

export interface EssayData {
    file: string;
    student: number;
    course: Course;
}

export interface EssayResponse {
    course: Course;
    file: string;
    id: number;
    sendDate: Date;
    status: Status;
    theme?: EssayThemeResponse;
}

export interface EssayListResponse {
    pages: number;
    count: number;
    page: EssayResponse[];
}

export interface ListEssayParams extends Partial<EssayInterface>, EssayPagination { }

const schema = yup.object().shape({
    file: yup.string().required('O arquivo é obrigatório'),
    student: yup.number().required('É preciso informar o usuário'),
    course: yup.string().required('É preciso informar o curso')
        .oneOf(['esa', 'espcex'])
})

export default class EssayController extends Controller<EssayData> {
    private repository: EssayRepository;
    private useCase: EssayCase;

    constructor(driver: Knex) {
        super(schema, driver);
        this.repository = new EssayRepository(driver);
        this.useCase = new EssayCase(this.repository);
    }

    private async parseEntity(essay: Essay): Promise<EssayResponse> {
        const themeController = new EssayThemeController(this.driver)
        return {
            course: essay.course,
            file: essay.file,
            id: essay.id,
            sendDate: essay.sendDate,
            status: essay.status,
            theme: await themeController.get({ id: essay.theme })
        }
    }

    public async create(rawData: EssayInput) {
        try {
            const data = await this.validate({
                ...rawData,
                file: rawData.file.path,
                student: rawData.student,
            })
            const created = await this.useCase.create(data);
            return this.parseEntity(created);
        } catch (error) {
            throw { message: error.message || 'Falha ao salvar redação' }
        }
    }

    public async myEssays(userId: number): Promise<EssayResponse[]> {
        try {
            const essays = await this.useCase.myEssays(userId);
            return Promise.all(essays.map(async essay => this.parseEntity(essay)));
        } catch (error) {
            throw { message: error.message || 'Falha ao consultar redações', status: 500 }
        }
    }

    public async allEssays(params: ListEssayParams): Promise<EssayListResponse> {
        try {
            const { ordering = 'sendDate', page = 1, pageSize = 10, ...filter } = params;
            const essays = await this.useCase.allEssays(filter, { ordering, page, pageSize });
            const count = await this.useCase.count(filter);
            const data = await Promise.all(essays.map(async essay => this.parseEntity(essay)));
            return {
                pages: Math.ceil(count / pageSize),
                page: data,
                count,
            }
        } catch (error) {
            throw { message: error.message || 'Falha ao consultar redações', status: 500 }
        }
    }

}