import { Knex } from "knex";
import { SettingsRepositoryInterface } from "../../cases/SettingsCase";
import Settings, { SettingsInterface } from "../../entities/Settings";
import Repository, { FieldsMap, prsr } from "./Repository";

export interface SettingsModel {
    readonly id: number;
    lastModified: Date;
    reviewExpiration: number;
    reviewRecuseExpiration: number;
}

export const SettingsService = (db: Knex) => db<Partial<SettingsModel>, SettingsModel[]>('settings');

const fieldsMap: FieldsMap<SettingsModel, SettingsInterface> = [
    [['id', prsr.nb], ['id', prsr.nb]],
    [['lastModified', prsr.dt], ['lastModified', prsr.dt]],
    [['reviewExpiration', prsr.nb], ['reviewExpiration', prsr.nb]],
    [['reviewRecuseExpiration', prsr.nb], ['reviewRecuseExpiration', prsr.nb]],
];

export default class SettingsRepository extends Repository<SettingsModel, SettingsInterface, Settings> implements SettingsRepositoryInterface {
    protected readonly fieldsMap = fieldsMap;
    protected readonly service = SettingsService;
    protected readonly entity = Settings;
    protected readonly searchFields = [];
}