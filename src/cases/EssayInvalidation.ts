import EssayInvalidation, { Reason } from "../entities/EssayInvalidation";

export interface EssayInvalidationCreationData {
    corrector: number;
    essay: number;
    reason: Reason;
    comment?: string;
}

export interface EssayInvalidationRepositoryInterface {
    create: (data: EssayInvalidationCreationData) => Promise<EssayInvalidation>;
}

export default class EssayInvalidationCase {
    private repository: EssayInvalidationRepositoryInterface;

    constructor(repository: EssayInvalidationRepositoryInterface) {
        this.repository = repository;
    }

}