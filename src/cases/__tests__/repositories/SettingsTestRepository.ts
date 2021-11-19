import TestRepository from "./TestRepository";
import { SettingsRepositoryInterface } from '../../SettingsCase';
import Settings, { SettingsInterface } from "../../../entities/Settings";
import { FakeDB } from "./database";

export default class SettingsTestRepository extends TestRepository<Settings, SettingsInterface> implements SettingsRepositoryInterface { 
    constructor(db: FakeDB) {
        super(db, Settings, 'settings');
    }
}