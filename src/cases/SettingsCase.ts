import Settings, { SettingsInterface } from "../entities/Settings";
import CaseError, { Errors } from "./ErrorCase";
import { createMethod, getMethod, updateMethod } from "./interfaces";

export interface SettingsRepositoryInterface {
    get: getMethod<Settings, SettingsInterface>;
    create: createMethod<SettingsInsertion, Settings>;
    update: updateMethod<Settings, SettingsInterface>;
}

export interface SettingsCreation {
    reviewExpiration: number;
}

export interface SettingsInsertion extends SettingsCreation {
    lastModified: Date;
}

export default class SettingsCase {

    constructor(private readonly repository: SettingsRepositoryInterface) { }

    public async updateOrCreate(data: SettingsCreation) {
        const current = await this.repository.get({});
        const infos = { ...data, lastModified: new Date() };
        if (current) return this.repository.update(current.id, infos);
        return this.repository.create(infos);
    }

    public async get() {
        const current = await this.repository.get({});
        if (!current) throw new CaseError('Configurações não encontradas', Errors.NOT_FOUND);
        return current;
    }
}