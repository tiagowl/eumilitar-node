import { contextFactory } from '../../../tests/shortcuts';
import SettingsController from '../controllers/SettingsController';

const context = contextFactory();

describe('Configurações do sistema', () => {
    const controller = new SettingsController(context);
    test('Criação', async done => {
        const created = await controller.updateOrCreate({
            reviewExpiration: 5,
        });
        expect(typeof created.id).toBe('number');
        expect(created.reviewExpiration).toBe(5);
        done();
    });
});