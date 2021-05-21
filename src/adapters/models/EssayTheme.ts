import { Knex } from "knex";
import { EssayThemeCreation, EssayThemeData, EssayThemeFilter, EssayThemeRepositoryInterface } from "../../cases/EssayThemeCase";
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
    deactivated: boolean;
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
        return { ...data, courses, deactivated: !!data.deactivated }
    }

    private filter(filter: EssayThemeFilter, service: Knex.QueryBuilder) {
        const entries = Object.entries(filter);
        return entries.reduce((query, [key, value]) => {
            if (key === 'courses') return query.where(function () {
                [...value].forEach(course => {
                    this.orWhere(key, 'like', `%${course}%`)
                })
            })
            return query.where(key, value);
        }, service)
    }

    private filterByActive(service: Knex.QueryBuilder, active?: boolean): Knex.QueryBuilder {
        const now = new Date();
        return active === true ?
            service.where(function () {
                return this.andWhere('startDate', '<=', now)
                    .andWhere('endDate', '>', now)
                    .andWhere('deactivated', false)
            })
            : active === false ?
                service.where(function () {
                    return this.orWhere('startDate', '>', now)
                        .orWhere('endDate', '<', now)
                        .orWhere('deactivated', true)
                }) : service;
    }

    public async exists(filter: EssayThemeFilter) {
        try {
            const service = EssayThemeService(this.driver);
            if ('reduce' in filter) {
                return filter.reduce((query, item) => {
                    return query.where(...item)
                }, service).then(data => !!data)
            }
            return this.filter(filter, service).first().then(data => !!data);
        } catch (error) {
            throw new Error('Falha ao consultar o banco de dados');
        }
    }

    public async get(filter: EssayThemeFilter, active?: boolean) {
        try {
            const service = this.filterByActive(EssayThemeService(this.driver), active);
            const theme = await this.filter(filter, service).first();
            return !!theme ? this.parseFromDB(theme) : undefined;
        } catch (error) {
            throw new Error('Falha ao consultar o banco de dados')
        }
    }

    public async create(data: EssayThemeCreation) {
        try {
            const parsed = await this.parseToInsert(data);
            const service = EssayThemeService(this.driver);
            const ids = await service.insert(parsed);
            const theme = await this.get({ id: ids[0] });
            if (!theme) throw new Error('Falha ao salvar tema');
            return theme;
        } catch {
            throw new Error('Falha ao gravar no banco de dados');
        }
    }

    public async hasActiveTheme(theme: EssayThemeData, idToIgnore?: number) {
        try {
            const service = EssayThemeService(this.driver);
            const qr = (typeof idToIgnore === 'number' ? service.andWhereNot('id', idToIgnore) : service)
                .andWhere(function () {
                    this.orWhere(function () {
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
                .andWhere('deactivated', false)
            return qr.first().then(data => !!data);
        } catch {
            throw new Error('Falha ao consultar o banco de dados');
        }
    }

    public async count() {
        try {
            const service = EssayThemeService(this.driver);
            const amount = await service.count<Record<string, { count: number }>>('id as count');
            return amount[0].count;
        } catch {
            throw new Error('Falha ao consultar banco de dados');
        }
    }

    public async findAll(page?: number, pageSize?: number, ordering?: keyof EssayThemeModel, active?: boolean) {
        try {
            const service = EssayThemeService(this.driver);
            const query = this.filterByActive(service, active);
            const themes = await query.orderBy(ordering || 'id', 'desc')
                .offset(((page || 1) - 1) * (pageSize || 10))
                .limit((pageSize || 10))
                .select<EssayThemeModel[]>('*');
            return Promise.all(themes.map(async theme => new EssayTheme(await this.parseFromDB(theme))));
        } catch {
            throw new Error('Falha ao consultar o banco de dados');
        }
    }

    public async update(id: number, data: EssayThemeCreation) {
        try {
            const parsedData = await this.parseToInsert(data)
            const service = EssayThemeService(this.driver);
            const updated = await service.where('id', id).update(parsedData);
            if (updated === 0) throw new Error('Falha ao atualizar tema');
            if (updated > 1) throw new Error(`${updated} temas foram modificados!`);
            const theme = await this.get({ id });
            if (!theme) throw new Error('Falha ao recuperar tema');
            return new EssayTheme(theme);
        } catch {
            throw new Error('Falha ao atualizar no banco de dados')
        }
    }
}