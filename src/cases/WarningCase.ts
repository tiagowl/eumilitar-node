import Warning, { WarningInterface } from "../entities/Warning";
import CaseError, { Errors } from "./ErrorCase";
import { createMethod, getMethod, updateMethod } from "./interfaces";

export interface WarningInsertionInterface {
    title: string;
    lastModified: Date;
    active: boolean;
    message?: string;
    image?: string;
}

export interface WarningRepositoryInterface {
    readonly get: getMethod<Warning, WarningInterface>;
    readonly update: updateMethod<Warning, WarningInterface>;
    readonly create: createMethod<WarningInsertionInterface, WarningInterface>;
}

export interface WarningCreation {
    title: string;
    active: boolean;
    message?: string;
    image?: string;
}

export default class WarningCase {
    private readonly repository: WarningRepositoryInterface;

    constructor(repository: WarningRepositoryInterface) {
        this.repository = repository;
    }

    public async updateOrCreate(data: WarningCreation) {
        if (!data.image && !data.message) throw new CaseError('É preciso informar a mensagem ou uma imagem', Errors.INVALID);
        if (data.image && data.message) throw new CaseError('Informe apenas uma mensagem ou uma imagem', Errors.INVALID);
        const exists = await this.repository.get({});
        const insertion = { ...data, lastModified: new Date(), };
        return !!exists ?
            this.repository.update(exists.id, insertion) :
            this.repository.create(insertion);
    }

    public async get() {
        return this.repository.get({});
    }
}