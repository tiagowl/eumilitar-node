import Warning, { WarningInterface } from "../entities/Warning";
import { createMethod, getMethod, updateMethod } from "./interfaces";

export interface WarningInsertionInterface {
    title: string;
    message: string;
    lastModified: Date;
}

export interface WarningRepositoryInterface {
    readonly get: getMethod<Warning, WarningInterface>;
    readonly update: updateMethod<Warning, WarningInterface>;
    readonly create: createMethod<WarningInsertionInterface, WarningInterface>;
}

export interface WarningCreation {
    title: string;
    message: string;
}

export default class WarningCase {
    private readonly repository: WarningRepositoryInterface;

    constructor(repository: WarningRepositoryInterface) {
        this.repository = repository;
    }

    public async updateOrCreate(data: WarningCreation) {
        const exists = await this.repository.get({});
        const insertion = { ...data, lastModified: new Date(), };
        return !!exists ?
            this.repository.update(exists.id, insertion) :
            this.repository.create(insertion);
    }
}