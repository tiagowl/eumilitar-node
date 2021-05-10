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
    hasActiveTheme: () => Promise<boolean>;
}

export default class EssayThemeCase {
    private repository: EssayThemeRepositoryInterface;

    constructor(repository: EssayThemeRepositoryInterface) {
        this.repository = repository;
    }

    public async create(data: EssayThemeCreation) {
        if (data.startDate >= data.endDate) throw new Error('A data de início deve ser anterior a data final');
        const hasActive = await this.repository.hasActiveTheme();
        if (hasActive) throw new Error('Já existe um tema ativo');
        return this.repository.create(data);
    }

}