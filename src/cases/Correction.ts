import Correction, { CorrectionInterface } from "../entities/Correction";
import Essay from "../entities/Essay";
import CaseError, { Errors } from "./Error";
import { EssayRepositoryInterface } from "./Essay";
import { createMethod, filterMethod, getMethod, updateMethod } from "./interfaces";
import { UserRepositoryInterface } from "./User";

export interface CorrectionBase {
    isReadable: string;
    hasMarginSpacing: string;
    obeyedMargins: string;
    erased: string;
    orthography: string;
    accentuation: string;
    agreement: string;
    repeated: string;
    veryShortSentences: string;
    understoodTheme: string;
    followedGenre: string;
    cohesion: string;
    organized: string;
    conclusion: string;
    comment: string;
    points: number;
}

export interface CorrectionData extends CorrectionBase {
    corrector: number;
    essay: number;
}

export interface CorrectionInsertionData extends CorrectionBase {
    correctionDate: Date;
    essay: number;
}

export interface CorrectionRepositoryInterface {
    readonly essays: EssayRepositoryInterface;
    readonly users: UserRepositoryInterface;
    readonly create: createMethod<CorrectionInsertionData, Correction>;
    readonly update: updateMethod<Correction, CorrectionInterface>;
    readonly get: getMethod<Correction, CorrectionInterface>;
}

export default class CorrectionCase {
    private readonly repository: CorrectionRepositoryInterface;

    constructor(repository: CorrectionRepositoryInterface) {
        this.repository = repository;
    }

    private async checkCorrector(corrector: number) {
        const correctorData = await this.repository.users.get({ id: corrector });
        if (!correctorData) throw new CaseError('Corretor não encontrado');
        const permissions = new Set(['admin', 'corrector']);
        if (!permissions.has(correctorData.permission)) throw new CaseError('Não autorizado');
        return correctorData;
    }

    private async getEssay(id: number) {
        const essay = await this.repository.essays.get({ id });
        if (!essay) throw new CaseError('Redação não encontrada');
        if (essay.status !== 'correcting') throw new CaseError('Redação não está em correção');
        return essay;
    }

    private async updateEssayState(essay: Essay) {
        essay.status = 'revised';
        return this.repository.essays.update(essay.id, essay.data);
    }

    public async create({ corrector, ...data }: CorrectionData) {
        const correctorData = await this.checkCorrector(corrector);
        const essay = await this.getEssay(data.essay);
        if (correctorData.id !== essay.corrector) throw new CaseError('Não autorizado');
        const correction = await this.repository.create({ ...data, correctionDate: new Date() });
        await this.updateEssayState(essay);
        return correction;
    }

    public async get(filter: Partial<CorrectionInterface>) {
        const recovered = await this.repository.get(filter);
        if (!recovered) throw new CaseError('Correção não encontrada', Errors.NOT_FOUND);
        return recovered;
    }

    public async update(essayId: number, userId: number, data: Partial<CorrectionBase>) {
        const user = await this.repository.users.get({ id: userId });
        const correction = await this.repository.get({ essay: essayId });
        const essay = await this.repository.essays.get({ id: essayId });
        if (!correction) throw new CaseError('Correção não encontrada', Errors.NOT_FOUND);
        if (!user) throw new CaseError('Usuário inválido', Errors.UNAUTHORIZED);
        if (user.permission === 'student') throw new CaseError('Corretor inválido', Errors.UNAUTHORIZED);
        if (!essay) throw new CaseError('Redação inexistente', Errors.NOT_FOUND);
        if (user.permission === 'corrector' && essay.corrector !== userId) throw new CaseError('Corretor inválido', Errors.UNAUTHORIZED);
        return this.repository.update(correction.id, data);
    }
}