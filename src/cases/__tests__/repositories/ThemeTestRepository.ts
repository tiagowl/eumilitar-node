import EssayTheme from "../../../entities/EssayTheme";
import { EssayThemeRepositoryInterface, EssayThemeCreation, EssayThemeFilter, EssayThemeData } from "../../EssayTheme";
import getDb from "./database";


const db = getDb();

export class EssayThemeTestRepository implements EssayThemeRepositoryInterface {
    database: any[];
    constructor() {
        this.database = [...db.essayThemes];
    }
    public async create(data: EssayThemeCreation) {
        const theme = {
            ...data,
            lastModified: new Date(),
        };
        this.database.push(theme);
        return new EssayTheme({
            ...theme,
            id: this.database.indexOf(theme),
        });
    }
    public async exists(filter: EssayThemeFilter) {
        const operations = {
            '=': (a: any, b: any) => a === b,
            '<=': (a: any, b: any) => (a <= b),
            '>=': (a: any, b: any) => (a >= b),
            '>': (a: any, b: any) => (a > b),
            '<': (a: any, b: any) => (a < b),
        };
        if ('reduce' in filter) {
            return filter.reduce((state, item) => {
                return !!this.database.find((data) => operations[item[1]](data[item[0]], item[2])) || state;
            }, false);
        }
        return !!this.database.find((data) => {
            const keys = Object.entries(filter);
            // @ts-ignore
            return keys.reduce((state, item) => {
                return (data[item[0]] === item[1]) && state;
            }, true);
        });
    }

    public async hasActiveTheme(data: EssayThemeData, idToIgnore?: number) {
        const database = !!idToIgnore ? this.database.filter(item => item.id !== idToIgnore) : this.database;
        return !!database.find((item: EssayTheme) => {
            return (
                (item.startDate <= data.startDate && item.endDate > data.endDate) ||
                (item.startDate > data.startDate && item.startDate < data.endDate)
            ) && !![...data.courses].find(dataTheme => dataTheme in [...item.courses]);
        });
    }

    public async findAll(page?: number, pageSize?: number, ordering?: keyof EssayTheme) {
        const start = ((page || 1) - 1) * (pageSize || 10);
        const end = pageSize || 10;
        const order = ordering || 'id';
        return [...this.database].slice(start, end).sort((a, b) => a[order] > b[order] ? 1 : a[order] < b[order] ? -1 : 0);
    }

    public async count() {
        return this.database.length;
    }

    public async update(id: number, data: EssayThemeCreation) {
        // @ts-ignore
        let theme: EssayTheme;
        // @ts-ignore
        this.database = this.database.map(item => {
            if (item.id === id) {
                item.update(data);
                theme = item;
            }
            return item;
        });
        // @ts-ignore
        return theme;
    }

    public async get(filter: EssayThemeFilter) {
        return this.database.find(item => {
            return Object.entries(filter)
                .reduce((valid, field) => {
                    return valid && (item[field[0]] === field[1]);
                }, true as boolean);
        });
    }
}