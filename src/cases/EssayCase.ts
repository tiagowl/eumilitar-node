import Essay, { EssayInterface, Status } from "../entities/Essay";
import EssayTheme, { Course } from '../entities/EssayTheme';
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
    exists: (is: Partial<EssayInterface>[]) => Promise<boolean>;
    filter: (filter: Partial<EssayInterface>, pagination?: EssayPagination) => Promise<Essay[]>;
    count: (filter: Partial<EssayInterface>) => Promise<number>;
    get: (filter: Partial<EssayInterface>) => Promise<Essay | undefined>;
    update: (id: number, data: Partial<EssayInsertionData>) => Promise<Essay>;
}

export interface EssayPagination {
    page?: number;
    pageSize?: number;
    ordering?: keyof EssayInterface;
}

export interface EssayPartialUpdate {
    corrector?: number;
    status?: Status;
}

const beautyCourse = {
    'esa': 'ESA',
    'espcex': 'EsPCEX',
}

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
        const baseFilter = { theme: theme.id, student: data.student }
        const cantSend = (await this.repository.exists([
            { ...baseFilter, status: 'pending' },
            { ...baseFilter, status: 'revised' },
        ]))
        if (cantSend) throw new Error(`Já foi enviada uma redação do curso "${beautyCourse[data.course]}" para o tema vigente`);
        const created = await this.repository.create({ ...data, theme: theme.id, sendDate: new Date(), status: 'pending' });
        return new Essay(created);
    }

    public async myEssays(userId: number) {
        return this.repository.filter({ student: userId });
    }

    public async allEssays(filter: Partial<EssayInterface>, pagination?: EssayPagination) {
        return this.repository.filter(filter, pagination);
    }

    public async count(filter: Partial<EssayInterface>) {
        return this.repository.count(filter);
    }

    public async get(filter: Partial<EssayInterface>) {
        return this.repository.get(filter)
    }

    public async partialUpdate(id: number, data: EssayPartialUpdate) {
        const essay = await this.repository.get({ id });
        if (!essay) throw new Error('Redação não encontrada');
        if (!!data.corrector) {
            const corrector = await this.repository.users.get({ id: data.corrector });
            if (!corrector) throw new Error('Corretor inválido');
            if (corrector.permission !== 'admin') throw new Error('Não autorizado!');
        }
        const fields = Object.entries(data) as [keyof EssayPartialUpdate, never][];
        fields.forEach(([field, value]) => {
            if (allowedUpdateFields.indexOf(field) > -1) {
                essay[field] = value;
            }
        })
        return this.repository.update(id, essay.data);
    }
}