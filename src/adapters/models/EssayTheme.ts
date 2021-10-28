import { Knex } from "knex";
import { EssayThemeCreation, EssayThemeData, EssayThemeFilter, EssayThemeRepositoryInterface } from "../../cases/EssayTheme";
import EssayTheme, { Course, EssayThemeInterface } from "../../entities/EssayTheme";
import { Logger } from 'winston';
import { Context } from "../interfaces";
import Repository, { FieldsMap, prsr } from "./Repository";

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

const divider = ', ';

export const EssayThemeService = (db: Knex) => db<Partial<EssayThemeInsertion>, EssayThemeModel[]>('essay_themes');

const fieldsMap: FieldsMap<EssayThemeModel, EssayThemeInterface> = [
    [['id', prsr.nb], ['id', prsr.nb]],
    [['title', prsr.st], ['title', prsr.st]],
    [['helpText', prsr.st], ['helpText', prsr.st]],
    [['file', prsr.st], ['file', prsr.st]],
    [['deactivated', Boolean], ['deactivated', Boolean]],
    [['endDate', prsr.dt], ['endDate', prsr.dt]],
    [['startDate', prsr.dt], ['startDate', prsr.dt]],
    [['lastModified', prsr.dt], ['lastModified', prsr.dt]],
    [['courses', (val: Set<Course>) => [...val].join(divider)], ['courses', (val: string) => new Set(val.split(divider) as Course[])]],
];

export default class EssayThemeRepository extends Repository<EssayThemeModel, EssayThemeInterface, EssayTheme> implements EssayThemeRepositoryInterface {
    protected readonly fieldsMap;
    protected readonly service;
    protected readonly entity;
    protected readonly searchFields = [];

    constructor(context: Context) {
        super(context);
        this.fieldsMap = fieldsMap;
        this.service = EssayThemeService;
        this.entity = EssayTheme;
    }

    private filterByActive(service: Knex.QueryBuilder, active?: boolean): Knex.QueryBuilder {
        const now = new Date();
        return active === true ?
            service.where(function () {
                return this.andWhere('startDate', '<=', now)
                    .andWhere('endDate', '>', now)
                    .andWhere('deactivated', false);
            })
            : active === false ?
                service.where(function () {
                    return this.orWhere('startDate', '>', now)
                        .orWhere('endDate', '<', now)
                        .orWhere('deactivated', true);
                }) : service;
    }

    public async exists(filter: EssayThemeFilter) {
        try {
            const service = this.query;
            if ('reduce' in filter) {
                return filter.reduce((query, item) => {
                    return query.where(...item);
                }, service).then(data => !!data);
            }
            const entries = Object.entries(filter);
            const res = entries.reduce((query, [key, value]) => {
                if (value instanceof Set) return query.where(function () {
                    [...value].forEach(course => {
                        this.orWhere(key, 'like', `%${course}%`);
                    });
                });
                else return query.where(key, value);
            }, service);
            const [{ total }] = await res.count({ total: '*' });
            return !!Number(total);
        } catch (error: any) {
            this.logger.error(error);
            throw new Error('Falha ao consultar o banco de dados');
        }
    }

    public async hasActiveTheme(theme: EssayThemeData, idToIgnore?: number) {
        try {
            const service = this.query;
            const qr = (typeof idToIgnore === 'number' ? service.andWhereNot('id', idToIgnore) : service)
                .andWhere(function () {
                    this.orWhere(function () {
                        return this.where('startDate', '<=', theme.startDate)
                            .where('endDate', '>', theme.startDate);
                    })
                        .orWhere(function () {
                            return this.where('startDate', '>', theme.startDate)
                                .where('startDate', '<', theme.endDate);
                        });
                })
                .andWhere(function () {
                    [...theme.courses].reduce((previous, value) => {
                        return previous.orWhere('courses', 'like', `%${value}%`);
                    }, this);
                })
                .andWhere('deactivated', false);
            return qr.first().then(data => !!data);
        } catch (error: any) {
            this.logger.error(error);
            throw new Error('Falha ao consultar o banco de dados');
        }
    }

    public async count() {
        try {
            const service = this.query;
            const amount = await service.count<Record<string, { count: number }>>('id as count');
            return amount[0].count;
        } catch (error: any) {
            this.logger.error(error);
            throw new Error('Falha ao consultar banco de dados');
        }
    }

    public async findAll(page?: number, pageSize?: number, ordering?: keyof EssayThemeModel, active?: boolean) {
        try {
            const service = this.query;
            const query = this.filterByActive(service, active);
            const themes = await query.orderBy(ordering || 'id', 'desc')
                .offset(((page || 1) - 1) * (pageSize || 10))
                .limit((pageSize || 10))
                .select<EssayThemeModel[]>('*');
            return Promise.all(themes.map(async theme => new EssayTheme(await this.toEntity(theme))));
        } catch (error: any) {
            this.logger.error(error);
            throw new Error('Falha ao consultar o banco de dados');
        }
    }

    public async get(filter: EssayThemeFilter & { active?: boolean }) {
        try {
            const { active, ...params } = filter;
            const service = this.filterByActive(this.query, active);
            const entries = Object.entries(params);
            const theme = await entries.reduce((query, [key, value]) => {
                if (key === 'courses') return query.where(function () {
                    [...value].forEach(course => {
                        this.orWhere(key, 'like', `%${course}%`);
                    });
                });
                return query.where(key, value);
            }, service).first();
            if (!theme) return;
            const data = await this.toEntity(theme);
            return new this.entity(data);
        } catch (error: any) {
            this.logger.error(error);
            throw new Error('Falha ao consultar o banco de dados');
        }
    }
}