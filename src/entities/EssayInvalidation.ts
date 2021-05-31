export type Reason = 'invalid' | 'unreadable' | 'tangent' | 'other';

export interface EssayInvalidationInterface {
    id: number;
    corrector: number;
    essay: number;
    reason: Reason;
    invalidationDate: Date;
    comment?: string;
}

export default class EssayInvalidation implements EssayInvalidationInterface {
    #id: number;
    #corrector: number;
    #essay: number;
    #reason: Reason;
    #comment?: string;
    #invalidationDate: Date;

    constructor(data: EssayInvalidationInterface) {
        this.#id = data.id;
        this.#corrector = data.corrector;
        this.#comment = data.comment;
        this.#essay = data.essay;
        this.#reason = data.reason;
        this.#invalidationDate = data.invalidationDate;
    }

    get id() { return this.#id }

    get corrector() { return this.#corrector }

    get essay() { return this.#essay }

    get reason() { return this.#reason }
    set reason(value: Reason) {
        this.#reason = value;
    }

    get comment(): string | undefined { return this.#comment }
    set comment(value: string | undefined) {
        this.#comment = value;
    }

    get invalidationDate() { return this.#invalidationDate }
}