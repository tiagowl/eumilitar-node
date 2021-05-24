import { Knex } from "knex";
import Essay from "../../entities/Essay";
import Controller from "./Controller";
import * as yup from 'yup';
import { EssayRepository } from "../models/Essay";
import EssayCase from "../../cases/EssayCase";
import { Course } from "../../entities/EssayTheme";

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
}

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
        return {
            course: essay.course,
            file: essay.file,
            id: essay.id,
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

    public async myEssays(userId: number) {
        try {
            const essays = await this.useCase.myEssays(userId);
            return Promise.all(essays.map(this.parseEntity));
        } catch (error) {
            throw { message: error.message || 'Falha ao consultar redações', status: 500 }
        }
    }

}