import { Knex } from "knex";
import { SettingsRepositoryInterface } from "../../cases/SettingsCase";
import Settings, { SettingsInterface } from "../../entities/Settings";
import Repository, { FieldsMap, prsr } from "./Repository";

export interface SettingsModel {
    readonly id: number;
    lastModified: Date;
    reviewExpiration: number;
    reviewRecuseExpiration: number;
    sellCorrections: boolean;
}

export const SettingsService = (db: Knex) => db<Partial<SettingsModel>, SettingsModel[]>('settings');

const fieldsMap: FieldsMap<SettingsModel, SettingsInterface> = [
    [['id', prsr.number], ['id', prsr.number]],
    [['lastModified', prsr.date], ['lastModified', prsr.date]],
    [['reviewExpiration', prsr.number], ['reviewExpiration', prsr.number]],
    [['reviewRecuseExpiration', prsr.number], ['reviewRecuseExpiration', prsr.number]],
    [['sellCorrections', prsr.bool], ['sellCorrections', prsr.bool]],
];

export default class SettingsRepository extends Repository<SettingsModel, SettingsInterface, Settings> implements SettingsRepositoryInterface {
    protected readonly fieldsMap = fieldsMap;
    protected readonly service = SettingsService;
    protected readonly entity = Settings;
    protected readonly searchFields = [];
}