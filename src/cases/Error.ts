

export default class CaseError extends Error {
    public readonly code?: string;

    constructor(message?: string, code?: string) {
        super(message);
        this.code = code;
    }
}