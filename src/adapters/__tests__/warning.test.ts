import faker from 'faker';
import { contextFactory } from '../../../tests/shortcuts';
import Warning from '../../entities/Warning';
import WarningController from '../controllers/WarningController';

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
    test('Recuperação', async done => {
        const recovered = await controller.get();
        expect(typeof recovered?.id).toBe('number');
        expect(typeof recovered?.lastModified).toBe('object');
        expect(typeof recovered?.title).toBe('string');
        expect(typeof recovered?.message).toBe('string');
        done();
    })
});