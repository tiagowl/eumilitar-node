import { Knex } from "knex";
import { EssayThemeCreation, EssayThemeRepositoryInterface } from "../../cases/EssayThemeCase";
import EssayTheme, { Course, EssayThemeInterface } from "../../entities/EssayTheme";

export interface EssayThemeModel extends EssayThemeInsertion {
    id: number;
    lastModified: Date;
}

export interface EssayThemeInsertion {
    title: string;
    startDate: Date;
    endDate: Date;
    helpText: string;
    file: string;
    courses: string;
}

export const EssayThemeService = (driver: Knex) => driver<EssayThemeInsertion, EssayThemeModel>('essay_themes');

export default class EssayThemeRepository implements EssayThemeRepositoryInterface {
    private service: Knex.QueryBuilder<EssayThemeInsertion, EssayThemeModel>;

    constructor(service: Knex.QueryBuilder<EssayThemeInsertion, EssayThemeModel>) {
        this.service = service;
    }

    private async parseToInsert(data: EssayThemeCreation): Promise<EssayThemeInsertion> {
        return { ...data, courses: [...data.courses].join(', ') }
    }

    private async parseFromDB(data: EssayThemeModel): Promise<EssayTheme> {
        const courses = new Set<Course>(data.courses.split(', ') as Course[]);
        return new EssayTheme({ ...data, courses });
    }

    public async create(data: EssayThemeCreation) {
        const parsed = await this.parseToInsert(data);
        const theme = await this.service.insert(parsed).returning<EssayThemeModel>('*');
        return this.parseFromDB(theme);
    }
}