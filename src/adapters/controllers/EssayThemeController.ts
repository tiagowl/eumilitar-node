import EssayTheme, { EssayThemeInterface } from "../../entities/EssayTheme";
import Controller from "./Controller";
import * as yup from 'yup';
import { Course } from '../../entities/EssayTheme';
import EssayThemeCase, { EssayThemeFilter } from "../../cases/EssayThemeCase";
import EssayThemeRepository, { EssayThemeModel } from '../models/EssayThemeRepository';
import { Context } from "../interfaces";
import { Filter } from "../../cases/interfaces";
import { EssayInterface } from "../../entities/Essay";

interface EssayThemeBaseInterface {
    title: string;
    startDate: Date;
    endDate: Date;
    helpText: string;
    deactivated: boolean;
    courses: Course[];
    videoUrl?: string;
}

export interface EssayThemeInput extends EssayThemeBaseInterface {
    file: Express.MulterS3.File;
}

export interface EssayThemeUpdating extends EssayThemeBaseInterface {
    file?: Express.MulterS3.File;
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
    videoUrl: yup.string().url().notRequired().nullable(true)
        .matches(/^((http|https)\:\/\/)?(www\.youtube\.com|youtu\.?be)\/((watch\?v=)?([a-zA-Z0-9]{11}))(&.*)*$/),
};

export const updatingSchema = yup.object({
    ...baseSchema,
    file: yup.string().notRequired(),
});

export const schema = yup.object({
    ...baseSchema,
    file: yup.string().required('O arquivo do tema é obrigatório'),
});

const toNumber = (data: string) => !!data ? Number(data) : undefined;

const filterFields = ['id', 'title', 'courses', 'startDate', 'endDate', 'lastModified'];
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
}).noUnknown();

export default class EssayThemeController extends Controller {
    private readonly repository: EssayThemeRepository;
    private readonly useCase: EssayThemeCase;

    constructor(context: Context) {
        super(context);
        this.repository = new EssayThemeRepository(context);
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
            videoUrl: theme.videoUrl,
        };
    }

    public async create(rawData: EssayThemeInput): Promise<EssayThemeResponse> {
        const data = await this.validate({ ...rawData, file: rawData.file.path || rawData.file.location }, schema) as EssayThemeData;
        try {
            const theme = await this.useCase.create({
                ...data,
                courses: new Set(data.courses),
            });
            return {
                ...theme.data,
                courses: [...theme.courses]
            } as EssayThemeResponse;
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async listAll(pagination?: EssayThemePagination): Promise<EssayThemeList> {
        try {
            const data = await querySchema.validate(pagination).catch(() => querySchema.cast(undefined));
            const page = await this.useCase.findAll(data.page, data?.size || 10, data.order as keyof EssayThemeInterface, data.active);
            const amount = await this.useCase.count();
            return {
                page: await Promise.all(page.map(this.parseEntity)),
                count: page.length,
                pages: Math.ceil(amount / data.size),
            } as EssayThemeList;
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async update(id: number, rawData: EssayThemeUpdating) {
        try {
            const data = await this.validate({
                ...rawData,
                file: rawData.file?.path || rawData.file?.location
            }, updatingSchema) as EssayThemeData;
            const theme = await this.useCase.update(id, {
                ...data,
                courses: new Set(data.courses),
            });
            return await this.parseEntity(theme);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async deactivate(id: number) {
        try {
            const theme = await this.useCase.deactivate(id);
            return await this.parseEntity(theme);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async get(filter: Partial<EssayThemeResponse>) {
        try {
            const filterData = !!filter.courses ? { ...filter, courses: new Set(filter.courses) } : filter as Filter<EssayThemeInterface>;
            const theme = await this.useCase.get(filterData);
            if (!theme) return;
            const entity = new EssayTheme(theme);
            return await this.parseEntity(entity);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

}