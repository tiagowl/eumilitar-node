import SettingsCase from "../SettingsCase"
import getDb from "./repositories/database"
import SettingsTestRepository from "./repositories/SettingsTestRepository"

const db = getDb();

describe('Teste nas configurações', () => {
    const repository = new SettingsTestRepository(db);
    const useCase = new SettingsCase(repository);
    test('Criação ou atualização', async done => {
        const created = await useCase.updateOrCreate({
            reviewExpiration: 10,
        });
        expect(typeof created.id).toBe('number');
        expect(created.reviewExpiration).toBe(10);
        expect(created.id).toBe(db.settings[0].id);
        expect(db.settings.length).toBe(1);
        done();
    })
})