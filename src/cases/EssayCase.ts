import { EssayInsertion } from "../adapters/models/EssayRepository";
import Essay, { EssayInterface, Status } from "../entities/Essay";
import { Reason, reasons } from "../entities/EssayInvalidation";
import EssayTheme, { Course } from '../entities/EssayTheme';
import Subscription from "../entities/Subscription";
import User from "../entities/User";
import { CorrectionRepositoryInterface } from "./CorrectionCase";
import CaseError, { Errors } from "./ErrorCase";
import { EssayInvalidationRepositoryInterface } from "./EssayInvalidationCase";
import { EssayThemeRepositoryInterface } from './EssayThemeCase';
import { Chart, countMethod, createMethod, existsMethod, Filter, filterMethod, getMethod, updateMethod } from "./interfaces";
import { ProductRepositoryInterface } from "./ProductCase";
import SingleEssayCase, { SingleEssayRepositoryInterface } from "./SingleEssayCase";
import { SubscriptionRepositoryInterface } from "./SubscriptionCase";
import { UserRepositoryInterface } from "./UserCase";

export interface EssayCreationData {
    file: string;
    student: number;
    course?: Course;
    token?: string;
    invalidEssay?: number;
}

export interface EssayCreationByToken {
    file: string;
    student: number;
    token: string;
}

export interface EssaySimpleCreation {
    file: string;
    student: number;
    course: Course;
}

export interface EssayCreationByInvalid {
    file: string;
    student: number;
    invalidEssay: number;
}

export interface EssayInsertionData extends EssayCreationData {
    theme: number;
    sendDate: Date;
    status: Status;
    course: Course;
}

export interface EssayRepositoryInterface {
    readonly themes: EssayThemeRepositoryInterface;
    readonly users: UserRepositoryInterface;
    readonly subscriptions: SubscriptionRepositoryInterface;
    readonly products: ProductRepositoryInterface;
    readonly singles: SingleEssayRepositoryInterface;
    readonly create: createMethod<EssayInsertionData, Essay>;
    readonly exists: existsMethod<EssayFilter>;
    readonly filter: filterMethod<Essay, EssayFilter>;
    readonly count: countMethod<EssayInterface>;
    readonly get: getMethod<Essay, EssayInterface>;
    readonly update: updateMethod<Essay, EssayInterface>;
    readonly evaluatedChart: (filter: EssayChartFilter) => Promise<Chart>;
    readonly avgTimeCorrection: (filter: EssayChartFilter) => Promise<Chart>;
    readonly invalidiationIsExpired: (essay: number) => Promise<boolean>;
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
    correctionPeriod?: {
        start?: Date;
        end?: Date;
    };
}

export interface EssayChartFilter extends Partial<EssayInterface> {
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
        const theme = await this.repository.themes.get({ courses: new Set([course]), active: true });
        if (!theme || !theme.active) throw new CaseError('Nenhum tema ativo para este curso', Errors.INVALID);
        return theme;
    }

    private async checkSubscriptions(userID: number, theme: EssayTheme) {
        const subscriptions = (await this.repository.subscriptions.filter({ user: userID, active: true }, sort, value)) as Subscription[];
        const hasPermission = await subscriptions.reduce(async (value, subscription) => {
            const permitted = await value;
            const expired = subscription.expiration <= new Date();
            const product = await this.repository.products.get({ id: subscription.product });
            if (!product) throw new CaseError('Produto não econtrado', Errors.NOT_FOUND);
            const validCourse = theme.courses.has(product.course);
            return (!expired && validCourse && subscription.active) || permitted;
        }, Promise.resolve(false) as Promise<boolean>);
        if (!hasPermission) throw new CaseError('Não autorizado', Errors.EXPIRED);
    }

    private async checkPermission(theme: EssayTheme, student: User, course: Course) {
        const baseFilter = { theme: theme.id, student: student.id };
        const cantSend = await this.repository.exists({
            ...baseFilter,
            operation: [
                { status: 'pending' },
                { status: 'revised' },
                { status: 'correcting' },
            ]
        });
        if (cantSend) throw new CaseError(`Já foi enviada uma redação do curso "${beautyCourse[course]}" para o tema vigente`);
    }

    private async createWithToken(data: EssayCreationByToken) {
        const singleCase = new SingleEssayCase(this.repository.singles, { expiration: 0 });
        const single = await singleCase.checkToken({ token: data.token, student: data.student });
        const essay = await this.repository.create({
            course: 'blank', theme: single.theme, sendDate: new Date(),
            status: 'pending', student: single.student, file: data.file,
        });
        await singleCase.update(single.id, { essay: essay.id, sentDate: new Date() });
        return essay;
    }

    private async simpleCreation(data: EssaySimpleCreation) {
        const student = await this.getStudent(data.student);
        const theme = await this.getTheme(data.course);
        await this.checkSubscriptions(student.id, theme);
        await this.checkPermission(theme, student, data.course);
        return this.repository.create({
            ...data, theme: theme.id, sendDate: new Date(), status: 'pending',
            course: data.course,
        });
    }

    private async checkIfCanResend(id: number, student: number) {
        const essay = await this.get({ id, student });
        const expired = await this.repository.invalidiationIsExpired(essay.id);
        if (expired) throw new CaseError('Prazo de reenvio expirado', Errors.EXPIRED);
        const valids = await this.count({ student, theme: essay.theme, status: 'revised' });
        const correcting = await this.count({ student, theme: essay.theme, status: 'correcting' });
        const pendings = await this.count({ student, theme: essay.theme, status: 'pending' });
        if (valids > 0 || pendings > 0 || correcting > 0) throw new CaseError('Já foi enviada uma redação para este tema', Errors.UNAUTHORIZED);
        return essay;
    }

    private async createWithInvalid(data: EssayCreationByInvalid) {
        const { invalidEssay, student, file } = data;
        const essay = await this.checkIfCanResend(invalidEssay, student);
        return this.repository.create({
            course: essay.course, theme: essay.theme,
            sendDate: new Date(), status: 'pending',
            student, file,
        });
    }

    public async create(data: EssayCreationData) {
        const { token, invalidEssay, course } = data;
        if (typeof token === 'string') return this.createWithToken({ token, ...data });
        if (typeof invalidEssay === 'number') return this.createWithInvalid({ invalidEssay, ...data });
        if (typeof course === 'string') return this.simpleCreation({ course, ...data });
        throw new CaseError('É preciso informar o token ou o curso', Errors.UNAUTHORIZED);
    }

    public async myEssays(student: number, sort: string, value: string) {
        return this.repository.filter({ student }, sort, value) as Promise<Essay[]>;
    }

    public async allEssays(filter: Filter<EssayFilter>) {
        return this.repository.filter(filter);
    }

    public async count(filter: EssayFilter) {
        return this.repository.count(filter);
    }

    public async get(filter: EssayFilter) {
        const essay = await this.repository.get(filter);
        if (!essay) throw new CaseError('Redação não encontrada', Errors.NOT_FOUND);
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

    public async sentChart(filter: EssayChartFilter, sort: string, value: string) {
        const { period, ...filterData } = filter;
        const start = period?.start || new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000);
        const end = period?.end || new Date();
        const months = Math.round((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
        const essays = await this.repository.filter(filterData) as Essay[];
        const chart = new Array(months).fill(0)
            .map(async (_, index) => {
                const current = start.getMonth() + index + 1;
                const date = new Date(start.getFullYear(), current, 1);
                const month = date.getMonth();
                const year = date.getFullYear();
                const value = essays.filter(({ sendDate }) => {
                    return sendDate.getFullYear() === year && sendDate.getMonth() === month;
                }).length;
                return {
                    key: `${month + 1}-${year}`,
                    value,
                };
            });
        return Promise.all(chart);
    }

    public async evaluatedChart(filter: EssayChartFilter) {
        return this.repository.evaluatedChart(filter);
    }

    public async avgTimeCorrection(filter: EssayChartFilter) {
        return this.repository.avgTimeCorrection(filter);
    }

    public async canResend(id: number, student: number) {
        try {
            const essay = await this.checkIfCanResend(id, student);
            return !!essay;
        } catch (error) {
            return false;
        }
    }

}