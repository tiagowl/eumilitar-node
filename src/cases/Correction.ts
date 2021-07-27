import Correction, { CorrectionInterface } from "../entities/Correction";
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
    essays: EssayRepositoryInterface;
    users: UserRepositoryInterface;
    create: (data: CorrectionInsertionData) => Promise<Correction>;
    get: (filter: Partial<CorrectionInterface>) => Promise<Correction>;
}

export default class CorrectionCase {
    private repository: CorrectionRepositoryInterface;

    constructor(repository: CorrectionRepositoryInterface) {
        this.repository = repository;
    }

    public async create({ corrector, ...data }: CorrectionData) {
        const correctorData = await this.repository.users.get({ id: corrector });
        if (!correctorData) throw new Error('Corretor não encontrado');
        if (['admin', 'corrector'].indexOf(correctorData.permission) < 0) throw new Error('Não autorizado');
        const essay = await this.repository.essays.get({ id: data.essay });
        if (!essay) throw new Error('Redação não encontrada');
        if (essay.status !== 'correcting') throw new Error('Redação não está em correção');
        if (correctorData.id !== essay.corrector) throw new Error('Não autorizado');
        const correction = await this.repository.create({ ...data, correctionDate: new Date() });
        essay.status = 'revised';
        await this.repository.essays.update(essay.id, essay.data);
        return correction;
    }

    public async get(filter: Partial<CorrectionInterface>) {
        return this.repository.get(filter);
    }
}