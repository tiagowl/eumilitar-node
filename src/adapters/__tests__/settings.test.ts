import { contextFactory } from '../../../tests/shortcuts';
import SettingsController from '../controllers/SettingsController';

const context = contextFactory();

describe('Configurações do sistema', () => {
    const controller = new SettingsController(context);
    test('Criação', async done => {
        const settings = await controller.updateOrCreate({
            reviewExpiration: 5,
        });
        expect(typeof settings.id).toBe('number');
        expect(settings.reviewExpiration).toBe(5);
        done();
    });
    test('Recuperaçã', async done => {
        const settings = await controller.get();
        expect(typeof settings.id).toBe('number');
        expect(settings.reviewExpiration).toBe(5);
        done();
    })
});