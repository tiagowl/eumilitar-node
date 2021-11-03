import faker from "faker";
import { jp } from "../../../tests/shortcuts";
import Warning from "../../entities/Warning";
import WarningCase from "../Warning";
import getDb from "./repositories/database";
import WarningTestRepository from "./repositories/WarningTestRepository";

const db = getDb();

describe("Alertas", () => {
    const repository = new WarningTestRepository(db);
    const useCase = new WarningCase(repository);
    test('Atualização', async done => {
        const [old] = getDb().warnings;
        const data = {
            title: 'Novo título',
            message: faker.lorem.paragraph(4),
        };
        const updated = await useCase.updateOrCreate(data);
        expect(updated.title).toBe(data.title);
        expect(updated.message).toBe(data.message);
        expect(updated.id).toBe(db.warnings[0].id);
        expect(updated, jp({ updated, old })).not.toMatchObject(old);
        done();
    });
    test('Criação', async done => {
        const deleted = await repository.delete({ id: db.warnings[0].id });
        expect(deleted).toBeGreaterThan(0);
        const created = await useCase.updateOrCreate({
            title: 'Novo título',
            message: faker.lorem.paragraph(4),
        });
        expect(created).toBeInstanceOf(Warning);
        done();
    })
});