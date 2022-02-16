import Essay, { EssayInterface, status, Status } from "../../entities/Essay";
import Controller from "./Controller";
import * as yup from 'yup';
import { EssayRepository } from "../models/EssayRepository";
import EssayCase, { EssayChartFilter, EssayCreationData, EssayFilter, EssayPagination, EssayPartialUpdate } from "../../cases/EssayCase";
import { Course } from "../../entities/EssayTheme";
import EssayThemeController, { EssayThemeResponse } from "./EssayThemeController";
import UserRepository from "../models/UserRepository";
import UserUseCase from "../../cases/UserCase";
import User, { AccountPermission } from "../../entities/User";
import { Context } from "../interfaces";
import CaseError, { Errors } from "../../cases/ErrorCase";
import { Paginated } from "../../cases/interfaces";

export interface EssayInput {
    file: Express.MulterS3.File;
    course?: Course;
    token?: string;
    invalidEssay?: number | string;
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
    corrector?: {
        id: number;
        name: string;
        permission: AccountPermission;
    } | null;
    student: {
        id: number;
        name: string;
        permission: AccountPermission;
    };
    canResend: boolean;
}

export interface EssayListResponse {
    pages: number;
    count: number;
    page: EssayResponse[];
}

export interface ListEssayParams extends EssayFilter, EssayPagination { }

const schema = yup.object().shape({
    file: yup.string().required('O arquivo é obrigatório'),
    student: yup.number().required('É preciso informar o usuário'),
    course: yup.string().oneOf(['esa', 'espcex']).notRequired(),
    token: yup.string().length(64, 'Token inválido').notRequired(),
    invalidEssay: yup.mixed().test({
        test: val => !val || /[0-9]{1,}/gm.test(val),
        message: "Este campo precisa ser um número"
    }).notRequired().transform(val => !!val ? Number(val) : val),
});

const partialUpdateSchema = yup.object().shape({
    corrector: yup.number(),
    status: yup.string().oneOf(status, "Status inválido"),
});

const filterSchema = yup.object().shape({
    course: yup.string().nullable(),
    sendDate: yup.date(),
    status: yup.string(),
    theme: yup.number(),
    corrector: yup.number(),
    student: yup.number(),
    search: yup.string(),
    period: yup.object({
        start: yup.date(),
        end: yup.date(),
    }),
    correctionPeriod: yup.object({
        start: yup.date(),
        end: yup.date(),
    }),
    page: yup.number().default(1),
    ordering: yup.string().default('sendDate')
});

export default class EssayController extends Controller {
    private readonly repository: EssayRepository;
    private readonly useCase: EssayCase;

    constructor(context: Context) {
        super(context);
        this.repository = new EssayRepository(context);
        this.useCase = new EssayCase(this.repository);
    }

    private async getUser(id: number) {
        const repository = new UserRepository(this.context);
        const userCase = new UserUseCase(repository);
        const user = await userCase.get(id);
        return {
            id: user.id,
            name: user.fullName,
            permission: user.permission,
        };
    }

    private parseEntity = async (essay: Essay, agent: User): Promise<EssayResponse> => {
        const themeController = new EssayThemeController(this.context);
        return {
            course: essay.course,
            file: essay.file,
            id: essay.id,
            sendDate: essay.sendDate,
            status: essay.status,
            theme: await themeController.get({ id: essay.theme }),
            student: await this.getUser(essay.student),
            corrector: !!essay.corrector ? await this.getUser(essay.corrector) : null,
            canResend: await this.useCase.canResend(essay.id, agent.id),
        };
    }

    public async create(rawData: EssayInput, agent: User) {
        try {
            const data = await this.validate({
                ...rawData,
                student: agent.id,
                file: rawData.file.path || rawData.file.location,
            }, schema) as EssayCreationData;
            const created = await this.useCase.create(data);
            return await this.parseEntity(created, agent);
        } catch (error: any) {
            this.logger.error(error);
            if (error instanceof CaseError && error.code === Errors.EXPIRED) {
                throw { message: error.message, status: 403 };
            }
            if (error.status) throw error;
            throw { message: error.message || 'Falha ao salvar redação' };
        }
    }

    public async myEssays(agent: User, sort: string, value: string): Promise<EssayResponse[]> {
        try {
            const essays = await this.useCase.myEssays(agent.id, sort, value);
            return Promise.all(essays.map((essay) => this.parseEntity(essay, agent)));
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async allEssays(params: ListEssayParams, agent: User): Promise<EssayListResponse> {
        try {
            const { ordering = 'sendDate', page = 1, pageSize = 10, ...filterData } = params;
            const filter = await this.castFilter(filterData, filterSchema);
            const essays = await this.useCase.allEssays({ pagination: { page, ordering, pageSize }, ...filter }) as Paginated<Essay>;
            return {
                ...essays,
                page: await Promise.all(essays.page.map((essay) => this.parseEntity(essay, agent)))
            };
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async get(id: number, agent: User) {
        try {
            await yup.number().required().validate(id);
            const essay = await this.useCase.get({ id });
            if (!essay) throw { message: 'Redação não encontrada', status: 404 };
            return await this.parseEntity(essay, agent);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async partialUpdate(id: number, data: EssayPartialUpdate, agent: User) {
        try {
            const validated = await this.validate({ ...data, corrector: agent.id }, partialUpdateSchema);
            const updated = await this.useCase.partialUpdate(id, validated);
            return await this.parseEntity(updated, agent);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async cancelCorrecting(id: number, corrector: number, agent: User) {
        try {
            const validation = yup.number().required();
            await validation.validate(id);
            await validation.validate(corrector);
            const updated = await this.useCase.cancelCorrecting(id, corrector);
            return await this.parseEntity(updated, agent);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async sentChart(filter: EssayChartFilter) {
        try {
            const parsed = await this.castFilter(filter, filterSchema);
            return await this.useCase.sentChart(parsed);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }

    public async evaluatedChart(filter: EssayChartFilter) {
        try {
            const parsed = await this.castFilter(filter, filterSchema);
            return await this.useCase.evaluatedChart(parsed);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }

    public async avgTimeCorrection(filter: EssayChartFilter) {
        try {
            const parsed = await this.castFilter(filter, filterSchema);
            return await this.useCase.avgTimeCorrection(parsed);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }

}