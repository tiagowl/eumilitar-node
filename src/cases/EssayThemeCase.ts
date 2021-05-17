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
    create: (data: EssayThemeCreation) => Promise<EssayThemeInterface>;
    exists: (filter: EssayThemeFilter) => Promise<boolean> | ((filter: EssayThemeFilter) => Promise<boolean>);
    hasActiveTheme: (data: EssayThemeData, notCheckId?: number) => Promise<boolean>;
    findAll: (page?: number, pageSize?: number, ordering?: keyof EssayThemeInterface) => Promise<EssayTheme[]>;
    count: () => Promise<number>;
    update: (id: number, data: EssayThemeCreation) => Promise<EssayTheme>;
    get: (filter: EssayThemeFilter) => Promise<EssayThemeInterface | undefined>;
}

export default class EssayThemeCase {
    private repository: EssayThemeRepositoryInterface;

    constructor(repository: EssayThemeRepositoryInterface) {
        this.repository = repository;
    }

    public async create(data: EssayThemeData) {
        if (data.startDate >= data.endDate) throw new Error('A data de início deve ser anterior a data final');
        const hasActive = await this.repository.hasActiveTheme(data);
        if (hasActive) throw new Error(`Já existe um tema ativo neste período.`);
        return this.repository.create({ ...data, deactivated: false });
    }

    public async findAll(page?: number, pageSize?: number, ordering?: keyof EssayThemeInterface): Promise<EssayTheme[]> {
        return this.repository.findAll(page, pageSize, ordering);
    }

    public async count() {
        return this.repository.count();
    }

    public async update(id: number, data: EssayThemeData) {
        const themeData = await this.repository.get({ id });
        if (!themeData) throw new Error('Tema não encontrado');
        if (data.startDate >= data.endDate) throw new Error('A data de início deve ser anterior a data final');
        const hasActive = await this.repository.hasActiveTheme(data, id);
        if (hasActive) throw new Error(`Já existe um tema ativo neste período.`);
        const theme = new EssayTheme(themeData);
        theme.update({ ...data, file: !!data.file ? data.file : themeData.file });
        return this.repository.update(id, theme.data);
    }

    public async deactivate(id: number) {
        const themeData = await this.repository.get({ id });
        if (!themeData) throw new Error('Tema não encontrado');
        const theme = new EssayTheme(themeData);
        theme.deactivated = true;
        return this.repository.update(id, theme.data);
    }

}