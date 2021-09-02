import Essay, { EssayInterface, Status } from "../entities/Essay";
import { Reason, reasons } from "../entities/EssayInvalidation";
import EssayTheme, { Course } from '../entities/EssayTheme';
import Subscription from "../entities/Subscription";
import User from "../entities/User";
import CaseError from "./Error";
import { EssayThemeRepositoryInterface } from './EssayThemeCase';
import { ProductRepositoryInterface } from "./ProductCase";
import { SubscriptionRepositoryInterface } from "./Subscription";
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
    readonly themes: EssayThemeRepositoryInterface;
    readonly users: UserRepositoryInterface;
    readonly subscriptions: SubscriptionRepositoryInterface;
    readonly products: ProductRepositoryInterface;
    readonly create: (data: EssayInsertionData) => Promise<Essay>;
    readonly exists: (is: EssayFilter[]) => Promise<boolean>;
    readonly filter: (filter: EssayFilter, pagination?: EssayPagination) => Promise<Essay[]>;
    readonly count: (filter: EssayFilter) => Promise<number>;
    readonly get: (filter: EssayFilter) => Promise<Essay | undefined>;
    readonly update: (id: number, data: Partial<EssayInsertionData>) => Promise<Essay>;
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
    period?: {
        start?: Date;
        end?: Date;
    };
}

const beautyCourse = {
    'esa': 'ESA',
    'espcex': 'EsPCEX',
    'blank': '',
};

export const allowedUpdateFields = ['corrector', 'status'];
const correctorPermissions = new Set(['admin', 'corrector']);

export default class EssayCase {
    private readonly repository: EssayRepositoryInterface;

    constructor(repository: EssayRepositoryInterface) {
        this.repository = repository;
    }

    private async getStudent(id: number) {
        const student = await this.repository.users.get({ id });
        if (!student) throw new CaseError('Aluno não encontrado');
        if (student.status !== 'active') throw new CaseError('Aluno inativo');
        return student;
    }

    private async getTheme(course: Course) {
        const themeData = await this.repository.themes.get({ courses: new Set([course]) }, true);
        if (!themeData) throw new CaseError('Nenhum tema ativo para este curso', 'invalid_theme');
        const theme = new EssayTheme(themeData);
        if (!theme.active) throw new CaseError('Tema inválido', 'invalid_theme');
        return theme;
    }

    private async checkSubscriptions(userID: number, theme: EssayTheme) {
        const subscriptions = (await this.repository.subscriptions.filter({ user: userID, active: true })) as Subscription[];
        const hasPermission = await subscriptions.reduce(async (value, subscription) => {
            const permitted = await value;
            const expired = subscription.expiration <= new Date();
            const product = await this.repository.products.get({ id: subscription.product });
            const validCourse = theme.courses.has(product.course);
            return (!expired && validCourse && subscription.active) || permitted;
        }, Promise.resolve(false) as Promise<boolean>);
        if (!hasPermission) throw new CaseError('Não autorizado', 'expired');
    }

    private async checkPermission(theme: EssayTheme, student: User, course: Course) {
        const baseFilter = { theme: theme.id, student: student.id };
        const cantSend = await this.repository.exists([
            { ...baseFilter, status: 'pending' },
            { ...baseFilter, status: 'revised' },
            { ...baseFilter, status: 'correcting' },
        ]);
        if (cantSend) throw new CaseError(`Já foi enviada uma redação do curso "${beautyCourse[course]}" para o tema vigente`);

    }

    public async create(data: EssayCreationData) {
        const student = await this.getStudent(data.student);
        const theme = await this.getTheme(data.course);
        await this.checkSubscriptions(student.id, theme);
        await this.checkPermission(theme, student, data.course);
        return this.repository.create({
            ...data, theme: theme.id, sendDate: new Date(), status: 'pending'
        });
    }

    public async myEssays(student: number) {
        return this.repository.filter({ student });
    }

    public async allEssays(filter: EssayFilter, pagination?: EssayPagination) {
        return this.repository.filter(filter, pagination);
    }

    public async count(filter: EssayFilter) {
        return this.repository.count(filter);
    }

    public async get(filter: EssayFilter) {
        const essay = await this.repository.get(filter);
        if (!essay) throw new CaseError('Redação não encontrada');
        return essay;
    }

    public async partialUpdate(id: number, data: EssayPartialUpdate, changingCorrector?: number) {
        const essay = await this.get({ id });
        if (typeof data.corrector === 'number') {
            const corrector = await this.repository.users.get({ id: data.corrector });
            if (!corrector) throw new CaseError('Corretor inválido');
            if (!correctorPermissions.has(corrector.permission)) throw new CaseError('Não autorizado!');
            if (typeof essay.corrector === 'number' && essay.corrector !== data.corrector) {
                throw new CaseError('Redação já está em correção');
            }
        }
        if (typeof changingCorrector === 'number' && changingCorrector !== essay.corrector) {
            throw new CaseError('Não autorizado');
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