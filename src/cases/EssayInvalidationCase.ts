import EssayInvalidation, { EssayInvalidationInterface, Reason, reasons } from "../entities/EssayInvalidation";
import CaseError from "./ErrorCase";
import { EssayRepositoryInterface } from "./EssayCase";
import { createMethod, getMethod } from "./interfaces";

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
    readonly create: createMethod<EssayInvalidationInsertionData, EssayInvalidation>;
    readonly essays: EssayRepositoryInterface;
    readonly get: getMethod<EssayInvalidation, EssayInvalidationInterface>;
}

export default class EssayInvalidationCase {
    private readonly repository: EssayInvalidationRepositoryInterface;

    constructor(repository: EssayInvalidationRepositoryInterface) {
        this.repository = repository;
    }

    public async create(data: EssayInvalidationCreationData) {
        const essay = await this.repository.essays.get({ id: data.essay });
        if (!essay) throw new CaseError('Redação não encontrada');
        if (essay.status !== 'correcting') throw new CaseError('Redação não está em correção');
        if (data.corrector !== essay.corrector) throw new CaseError('Não autorizado');
        if (!reasons.has(data.reason)) throw new CaseError('Razão inválida');
        essay.status = 'invalid';
        await this.repository.essays.update(essay.id, essay.data);
        return this.repository.create({ ...data, invalidationDate: new Date() });
    }

    public async get(essayId: number) {
        return this.repository.get({ essay: essayId });
    }

}