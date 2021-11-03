import faker from 'faker';
import { contextFactory } from '../../../tests/shortcuts';
import WarningController from '../controllers/Warning';

const context = contextFactory();

describe('Alertas', () => {
    const controller = new WarningController(context);
    test('Criação', async done => {
        const data = {
            title: 'Título de teste',
            message: faker.lorem.paragraph(4),
            active: true,
        };
        const created = await controller.createOrUpdate(data);
        expect(typeof created.id).toBe('number');
        expect(typeof created.lastModified).toBe('object');
        expect(created.title).toBe(data.title);
        expect(created.message).toBe(data.message);
        done();
    });
});