import Essay, { EssayInterface, Status } from "../entities/Essay";
import { Reason, reasons } from "../entities/EssayInvalidation";
import EssayTheme, { Course } from '../entities/EssayTheme';
import EssayInvalidationCase, { EssayInvalidationRepositoryInterface } from "./EssayInvalidation";
import { EssayThemeRepositoryInterface } from './EssayThemeCase';
import { UserRepositoryInterface } from "./UserUseCase";

export interface EssayCreationData {
    file: string;
    student: number;
    course: Course;
}

export interface EssayInsertionData extends EssayCreationData {
    theme: number;
    sendDate: Date;
    status: Status;
}

export interface EssayRepositoryInterface {
    themes: EssayThemeRepositoryInterface;
    users: UserRepositoryInterface;
    create: (data: EssayInsertionData) => Promise<EssayInterface>;
    exists: (is: EssayFilter[]) => Promise<boolean>;
    filter: (filter: EssayFilter, pagination?: EssayPagination) => Promise<Essay[]>;
    count: (filter: EssayFilter) => Promise<number>;
    get: (filter: EssayFilter) => Promise<Essay | undefined>;
    update: (id: number, data: Partial<EssayInsertionData>) => Promise<Essay>;
}

export interface EssayPagination {
    page?: number;
    pageSize?: number;
    ordering?: keyof EssayInterface;
}

export interface EssayPartialUpdate {
    corrector?: number | null;
    status?: Status;
}

export interface EssayInvalidationData {
    corrector: number;
    essay: number;
    reason: Reason;
    comment?: string;
}

export interface EssayFilter extends Partial<EssayInterface> {
    search?: string;
}

const beautyCourse = {
    'esa': 'ESA',
    'espcex': 'EsPCEX',
};

export const allowedUpdateFields = ['corrector', 'status'];

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
        const baseFilter = { theme: theme.id, student: data.student };
        const cantSend = (await this.repository.exists([
            { ...baseFilter, status: 'pending' },
            { ...baseFilter, status: 'revised' },
        ]));
        if (cantSend) throw new Error(`Já foi enviada uma redação do curso "${beautyCourse[data.course]}" para o tema vigente`);
        const created = await this.repository.create({ ...data, theme: theme.id, sendDate: new Date(), status: 'pending' });
        return new Essay(created);
    }

    public async myEssays(userId: number) {
        return this.repository.filter({ student: userId });
    }

    public async allEssays(filter: EssayFilter, pagination?: EssayPagination) {
        return this.repository.filter(filter, pagination);
    }

    public async count(filter: EssayFilter) {
        return this.repository.count(filter);
    }

    public async get(filter: EssayFilter) {
        const essay = await this.repository.get(filter);
        if (!essay) throw new Error('Redação não encontrada');
        return essay;
    }

    public async partialUpdate(id: number, data: EssayPartialUpdate, changingCorrector?: number) {
        const essay = await this.get({ id });
        if (typeof data.corrector === 'number') {
            const corrector = await this.repository.users.get({ id: data.corrector });
            if (!corrector) throw new Error('Corretor inválido');
            if (corrector.permission !== 'admin') throw new Error('Não autorizado!');
            if (typeof essay.corrector === 'number' && essay.corrector !== data.corrector) {
                throw new Error('Redação já está em correção');
            }
        }
        if (typeof changingCorrector === 'number' && changingCorrector !== essay.corrector) {
            throw new Error('Não autorizado');
        }
        const fields = Object.entries(data) as [keyof EssayPartialUpdate, never][];
        fields.forEach(([field, value]) => {
            if (allowedUpdateFields.indexOf(field) > -1) {
                essay[field] = value;
            }
        });
        if (typeof changingCorrector === 'number' && data?.corrector === null) {
            essay.corrector = null;
        }
        return this.repository.update(id, essay.data);
    }

    public async cancelCorrecting(id: number, corrector: number) {
        return this.partialUpdate(id, { status: 'pending', corrector: null }, corrector);
    }

}