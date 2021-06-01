import EssayInvalidation, { Reason, reasons } from "../entities/EssayInvalidation";
import { EssayRepositoryInterface } from "./EssayCase";

export interface EssayInvalidationCreationData {
    corrector: number;
    essay: number;
    reason: Reason;
    comment?: string;
}

export interface EssayInvalidationInsertionData extends EssayInvalidationCreationData {
    invalidationDate: Date;
}

export interface EssayInvalidationRepositoryInterface {
    create: (data: EssayInvalidationInsertionData) => Promise<EssayInvalidation>;
    essays: EssayRepositoryInterface;
}

export default class EssayInvalidationCase {
    private repository: EssayInvalidationRepositoryInterface;

    constructor(repository: EssayInvalidationRepositoryInterface) {
        this.repository = repository;
    }

    public async create(data: EssayInvalidationCreationData) {
        const essay = await this.repository.essays.get({ id: data.essay });
        if (!essay) throw new Error('Redação não encontrada');
        if (essay.status !== 'correcting') throw new Error('Redação não está em correção');
        if (data.corrector !== essay.corrector) throw new Error('Não autorizado');
        if (reasons.indexOf(data.reason) < 0) throw new Error('Razão inválida');
        essay.status = 'invalid';
        await this.repository.essays.update(essay.id, essay.data);
        return this.repository.create({ ...data, invalidationDate: new Date() });
    }

}