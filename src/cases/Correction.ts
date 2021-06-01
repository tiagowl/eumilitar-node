import Correction from "../entities/Correction";
import { EssayRepositoryInterface } from "./EssayCase";
import { UserRepositoryInterface } from "./UserUseCase";

export interface CorrectionData {
    essay: number;
    corrector: number;
    isReadable: boolean;
    hasMarginSpacing: boolean;
    obeyedMargins: boolean;
    erased: boolean;
    orthography: boolean;
    accentuation: boolean;
    agreement: boolean;
    repeated: boolean;
    veryShortSentences: boolean;
    understoodTheme: boolean;
    followedGenre: boolean;
    cohesion: boolean;
    organized: boolean;
    conclusion: boolean;
    comment: string;
    points: number;
}

export interface CorrectionInsertionData extends CorrectionData {
    correctionDate: Date;
}

export interface CorrectionRepositoryInterface {
    essays: EssayRepositoryInterface;
    users: UserRepositoryInterface;
    create: (data: CorrectionInsertionData) => Promise<Correction>
}

export default class CorrectionCase {
    private repository: CorrectionRepositoryInterface;

    constructor(repository: CorrectionRepositoryInterface) {
        this.repository = repository;
    }

    public async create(data: CorrectionData) {
        const corrector = await this.repository.users.get({ id: data.corrector });
        if (!corrector) throw new Error('Corretor não encontrado');
        if (corrector.permission !== 'admin') throw new Error('Não autorizado');
        const essay = await this.repository.essays.get({ id: data.essay });
        if (!essay) throw new Error('Redação não encontrada');
        if (essay.status !== 'correcting') throw new Error('Redação não está em correção');
        if (essay.corrector !== essay.corrector) throw new Error('Não autorizado');
        return this.repository.create({ ...data, correctionDate: new Date() });
    }
}