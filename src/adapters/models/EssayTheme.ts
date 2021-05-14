import { Knex } from "knex";
import { EssayThemeCreation, EssayThemeFilter, EssayThemeRepositoryInterface } from "../../cases/EssayThemeCase";
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

const divider = ', '

export const EssayThemeService = (driver: Knex) => driver<EssayThemeInsertion, EssayThemeModel>('essay_themes');

export default class EssayThemeRepository implements EssayThemeRepositoryInterface {
    private driver: Knex;

    constructor(driver: Knex) {
        this.driver = driver;
    }

    private async parseToInsert(data: EssayThemeCreation): Promise<EssayThemeInsertion> {
        return { ...data, courses: [...data.courses].join(divider) }
    }

    private async parseFromDB(data: EssayThemeModel): Promise<EssayThemeInterface> {
        const courses = new Set<Course>(data.courses.split(divider) as Course[]);
        return { ...data, courses }
    }

    public async exists(filter: EssayThemeFilter) {
        const service = EssayThemeService(this.driver);
        if ('reduce' in filter) {
            return filter.reduce((query, item) => {
                return query.where(...item)
            }, service).then(data => !!data)
        }
        return service.where(filter).first().then(data => !!data)
    }

    public async get(filter: EssayThemeFilter) {
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

    public async hasActiveTheme(theme: EssayThemeCreation, idToIgnore?: number) {
        const service = EssayThemeService(this.driver);
        const qr = service
            .andWhere(function () {
                this
                    .orWhere(function () {
                        return this.where('startDate', '<=', theme.startDate)
                            .where('endDate', '>', theme.startDate)
                    })
                    .orWhere(function () {
                        return this.where('startDate', '>', theme.startDate)
                            .where('startDate', '<', theme.endDate)
                    })
            })
            .andWhere(function () {
                [...theme.courses].reduce((previous, value) => {
                    return previous.orWhere('courses', 'like', `%${value}%`)
                }, this)
            })
        if (idToIgnore) {
            qr.andWhereNot('id', idToIgnore);
        }
        return qr.first().then(data => !!data);
    }

    public async count() {
        const service = EssayThemeService(this.driver);
        const amount = await service.count<Record<string, { count: number }>>('id as count');
        return amount[0].count
    }

    public async findAll(page?: number, pageSize?: number, ordering?: keyof EssayThemeModel) {
        const service = EssayThemeService(this.driver)
        const themes = await service.orderBy(ordering || 'id', 'desc').offset(((page || 1) - 1) * (pageSize || 10)).limit((pageSize || 10)).select<EssayThemeModel[]>('*');
        return Promise.all(themes.map(async theme => new EssayTheme(await this.parseFromDB(theme))))
    }

    public async update(id: number, data: EssayThemeCreation) {
        const parsedData = await this.parseToInsert(data)
        const service = EssayThemeService(this.driver);
        const updated = await service.where('id', id).update(parsedData);
        if (updated === 0) throw new Error('Falha ao atualizar tema');
        if (updated > 1) throw new Error(`${updated} temas foram modificados!`);
        const theme = await this.get({ id });
        if (!theme) throw new Error('Falha ao recuperar tema');
        return new EssayTheme(theme);
    }
}