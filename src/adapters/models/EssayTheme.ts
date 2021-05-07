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
    private driver: Knex;

    constructor(driver: Knex) {
        this.driver = driver;
    }

    private async parseToInsert(data: EssayThemeCreation): Promise<EssayThemeInsertion> {
        return { ...data, courses: [...data.courses].join(', ') }
    }

    private async parseFromDB(data: EssayThemeModel): Promise<EssayThemeInterface> {
        const courses = new Set<Course>(data.courses.split(', ') as Course[]);
        return { ...data, courses }
    }

    public async get(filter: Partial<EssayThemeModel>) {
        const service = EssayThemeService(this.driver);
        const theme = await service.where(filter).first();
        return !!theme ? this.parseFromDB(theme) : undefined;
    }

    public async create(data: EssayThemeCreation) {
        const parsed = await this.parseToInsert(data);
        const service = EssayThemeService(this.driver);
        const ids = await service.insert(parsed);
        const theme = await this.get({ id: ids[0] });
        if (!theme) throw new Error('Falha ao salvar tema');
        return theme;
    }
}