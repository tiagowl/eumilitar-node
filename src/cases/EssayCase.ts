import Essay, { EssayInterface } from "../entities/Essay";
import EssayTheme, { Course } from '../entities/EssayTheme';
import { EssayThemeRepositoryInterface } from './EssayThemeCase';

export interface EssayCreationData {
    file: string;
    student: number;
    course: Course;
}

export interface EssayInsertionData extends EssayCreationData {
    theme: number;
    sendDate: Date;
}

export interface EssayRepositoryInterface {
    create: (data: EssayInsertionData) => Promise<EssayInterface>;
    themes: EssayThemeRepositoryInterface;
    exists: (is: Partial<EssayInterface>[]) => Promise<boolean>;
    filter: (filter: Partial<EssayInterface>) => Promise<Essay[]>;
}

const beautyCourse = {
    'esa': 'ESA',
    'espcex': 'EsPCEX',
}

export default class EssayCase {
    private repository: EssayRepositoryInterface;

    constructor(repository: EssayRepositoryInterface) {
        this.repository = repository;
    }

    public async create(data: EssayCreationData) {
        const themeData = await this.repository.themes.get({ courses: new Set([data.course]) }, true);
        if (!themeData) throw new Error('Nenhum tema ativo para este curso');
        const theme = new EssayTheme(themeData);
        if (!theme.active) throw new Error('Tema inválido');
        const baseFilter = { theme: theme.id, student: data.student }
        const canSend = !(await this.repository.exists([
            { ...baseFilter, status: 'pending' },
            { ...baseFilter, status: 'revised' },
        ]))
        if (!canSend) throw new Error(`Já foi enviada uma redação do curso "${beautyCourse[data.course]}" para o tema vigente`);
        const created = await this.repository.create({ ...data, theme: theme.id, sendDate: new Date() });
        return new Essay(created);
    }

    public async myEssays(userId: number) {
        return this.repository.filter({ student: userId });
    }

}