import EssayTheme, { Course, EssayThemeInterface } from "../entities/EssayTheme";

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
} | [keyof EssayTheme, Operator, any][]

export interface EssayThemeCreation {
    title: string;
    startDate: Date;
    endDate: Date;
    helpText: string;
    file: string;
    courses: Set<Course>;
}

export interface EssayThemeRepositoryInterface {
    create: (data: EssayThemeCreation) => Promise<EssayThemeInterface>;
    exists: (filter: EssayThemeFilter) => Promise<boolean> | ((filter: EssayThemeFilter) => Promise<boolean>);
    hasActiveTheme: (data: EssayThemeCreation) => Promise<boolean>;
    findAll: (page?: number, pageSize?: number, ordering?: keyof EssayThemeInterface) => Promise<EssayTheme[]>;
    count: () => Promise<number>;
}

export default class EssayThemeCase {
    private repository: EssayThemeRepositoryInterface;

    constructor(repository: EssayThemeRepositoryInterface) {
        this.repository = repository;
    }

    public async create(data: EssayThemeCreation) {
        if (data.startDate >= data.endDate) throw new Error('A data de início deve ser anterior a data final');
        const hasActive = await this.repository.hasActiveTheme(data);
        if (hasActive) throw new Error(`Já existe um tema ativo neste período.`);
        return this.repository.create(data);
    }

    public async findAll(page?: number, pageSize?: number, ordering?: keyof EssayThemeInterface): Promise<EssayTheme[]> {
        return this.repository.findAll(page, pageSize, ordering);
    }

    public async count() {
        return this.repository.count();
    }

}