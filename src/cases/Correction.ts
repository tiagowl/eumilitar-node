import Correction, { CorrectionInterface } from "../entities/Correction";
import Essay from "../entities/Essay";
import CaseError from "./Error";
import { EssayRepositoryInterface } from "./EssayCase";
import { UserRepositoryInterface } from "./UserUseCase";

export interface CorrectionBase {
    essay: number;
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
}

export interface CorrectionInsertionData extends CorrectionBase {
    correctionDate: Date;
}

export interface CorrectionRepositoryInterface {
    readonly essays: EssayRepositoryInterface;
    readonly users: UserRepositoryInterface;
    readonly create: (data: CorrectionInsertionData) => Promise<Correction>;
    readonly get: (filter: Partial<CorrectionInterface>) => Promise<Correction>;
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
        return this.repository.get(filter);
    }
}