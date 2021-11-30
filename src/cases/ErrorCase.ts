
export enum Errors {
    NOT_FOUND = 'NOT_FOUND',
    WRONG_PASSWORD = 'WRONG_PASSWORD',
    EXPIRED = 'EXPIRED',
    INVALID = 'INVALID',
    UNAUTHORIZED = 'UNAUTHORIZED',
}

export default class CaseError extends Error {
    public readonly code?: Errors;

    constructor(message?: string, code?: Errors) {
        super(message);
        this.code = code;
    }
}