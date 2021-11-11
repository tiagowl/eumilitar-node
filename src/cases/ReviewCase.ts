import Review, { ReviewInterface } from "../entities/Review";
import CaseError, { Errors } from "./ErrorCase";
import { createMethod, existsMethod, filterMethod } from "./interfaces";

export interface ReviewCreation {
    grade: number;
    user: number;
    description?: string;
}

export interface ReviewInsertion extends ReviewCreation {
    registrationDate: Date;
}

export interface ReviewRepositoryInterface {
    readonly create: createMethod<ReviewInsertion, Review>;
    readonly exists: existsMethod<ReviewInterface>;
}

export interface ReviewSettings {
    readonly expiration: number;
}

export default class ReviewCase {

    constructor(private readonly repository: ReviewRepositoryInterface, private readonly settings: ReviewSettings) { }

    public async canSend(user: number) {
        const expiration = Date.now() - this.settings.expiration * 24 * 60 * 60 * 1000;
        const sent = await this.repository.exists({
            user,
            operation: [
                ['registrationDate', '>', new Date(expiration)],
            ]
        });
        return !sent;
    }

    public async create(data: ReviewCreation) {
        const canSend = await this.canSend(data.user);
        if (!canSend) throw new CaseError('Já foi enviado uma avaliação', Errors.UNAUTHORIZED);
        return this.repository.create({
            ...data,
            registrationDate: new Date(),
        });
    }
}