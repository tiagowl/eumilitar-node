import EssayTheme, { Course, EssayThemeInterface } from "../entities/EssayTheme";
import CaseError from "./ErrorCase";
import { countMethod, createMethod, existsMethod, Filter, filterMethod, getMethod, updateMethod } from "./interfaces";

export type Operator = '=' | '<=' | '>=' | '>' | '<';

export type EssayThemeFilter = {
    id?: number;
    title?: string;
    startDate?: Date;
    endDate?: Date;
    lastModified?: Date;
    helpText?: string;
    file?: string;
    courses?: Set<Course>;
} | [keyof EssayThemeInterface, Operator, any][];

export interface EssayThemeData {
    title: string;
    startDate: Date;
    endDate: Date;
    helpText: string;
    file: string;
    courses: Set<Course>;
}

export interface EssayThemeCreation extends EssayThemeData {
    deactivated: boolean;
}

export interface EssayThemeRepositoryInterface {
    readonly create: createMethod<EssayThemeCreation, EssayTheme>;
    readonly count: countMethod<EssayTheme>;
    readonly update: updateMethod<EssayTheme, EssayThemeInterface>;
    readonly exists: (filter: EssayThemeFilter) => Promise<boolean> | ((filter: EssayThemeFilter) => Promise<boolean>);
    readonly get: getMethod<EssayTheme, EssayThemeInterface & { active?: boolean }>;
    readonly hasActiveTheme: (data: EssayThemeData, notCheckId?: number) => Promise<boolean>;
    readonly findAll: (page?: number, pageSize?: number, ordering?: keyof EssayThemeInterface, active?: boolean, title?:string) => Promise<EssayTheme[]>;
}

export default class EssayThemeCase {
    private readonly repository: EssayThemeRepositoryInterface;

    constructor(repository: EssayThemeRepositoryInterface) {
        this.repository = repository;
    }

    public async create(data: EssayThemeData) {
        if (data.startDate >= data.endDate) throw new CaseError('A data de início deve ser anterior a data final');
        const hasActive = await this.repository.hasActiveTheme(data);
        if (hasActive) throw new CaseError(`Já existe um tema ativo neste período.`);
        return this.repository.create({ ...data, deactivated: false });
    }

    public async findAll(page?: number, pageSize?: number, ordering?: keyof EssayThemeInterface, active?: boolean, title?: string): Promise<EssayTheme[]> {
        return this.repository.findAll(page, pageSize, ordering, active, title);
    }

    public async count() {
        return this.repository.count({});
    }

    public async update(id: number, data: EssayThemeData) {
        const themeData = await this.repository.get({ id });
        if (!themeData) throw new CaseError('Tema não encontrado');
        if (data.startDate >= data.endDate) throw new CaseError('A data de início deve ser anterior a data final');
        const hasActive = await this.repository.hasActiveTheme(data, id);
        if (hasActive) throw new CaseError(`Já existe um tema ativo neste período.`);
        const theme = new EssayTheme(themeData);
        theme.update({ ...data, file: !!data.file ? data.file : themeData.file });
        return this.repository.update(id, theme.data);
    }

    public async deactivate(id: number) {
        const themeData = await this.repository.get({ id });
        if (!themeData) throw new CaseError('Tema não encontrado');
        const theme = new EssayTheme(themeData);
        theme.deactivated = true;
        return this.repository.update(id, theme.data);
    }

    public async get(filter: Filter<EssayThemeInterface> & { active?: boolean }) {
        return this.repository.get(filter);
    }

}