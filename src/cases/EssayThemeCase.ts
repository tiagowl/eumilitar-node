import EssayTheme, { Course, EssayThemeInterface } from "../entities/EssayTheme";

export interface EssayThemeFilter {
    id?: number;
    title?: string;
    startDate?: Date;
    endDate?: Date;
    lastModified?: Date;
    helpText?: string;
    file?: string;
    courses?: Set<Course>;
}

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
}

export default class EssayThemeCase {
    private repository: EssayThemeRepositoryInterface;

    constructor(repository: EssayThemeRepositoryInterface) {
        this.repository = repository;
    }

    public async create(data: EssayThemeCreation) {
        if (data.startDate >= data.endDate) throw new Error('A data de início deve ser anterior a data final')
        return this.repository.create(data);
    }

}