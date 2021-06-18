import EssayInvalidation, { EssayInvalidationInterface, Reason, reasons } from "../../entities/EssayInvalidation";
import Controller from "./Controller";
import * as yup from 'yup';
import { Knex } from "knex";
import EssayInvalidationCase, { EssayInvalidationCreationData, EssayInvalidationRepositoryInterface } from "../../cases/EssayInvalidation";
import EssayInvalidationRepository from "../models/EssayInvalidation";

const schema = yup.object().shape({
    corrector: yup.number().required("É preciso informar o corretor!"),
    essay: yup.number().required('É preciso informar a redação'),
    reason: yup.string().oneOf(reasons, "Motivo inválido").required('É preciso informar o motivo'),
    comment: yup.string().when('reason', {
        is: (val: Reason) => val === 'other',
        then: yup.string().required('É preciso descrever o motivo'),
        otherwise: yup.string(),
    }),
});

export default class EssayInvalidationController extends Controller<EssayInvalidationCreationData> {
    private useCase: EssayInvalidationCase;
    private repository: EssayInvalidationRepositoryInterface;

    constructor(driver: Knex) {
        super(schema, driver);
        this.repository = new EssayInvalidationRepository(driver);
        this.useCase = new EssayInvalidationCase(this.repository);
    }

    private async parseEntity(entity: EssayInvalidation): Promise<EssayInvalidationInterface> {
        return {
            id: entity.id,
            essay: entity.essay,
            corrector: entity.corrector,
            reason: entity.reason,
            invalidationDate: entity.invalidationDate,
            comment: entity.comment,
        };
    }

    public async create(data: EssayInvalidationCreationData) {
        try {
            const validated = await this.validate(data);
            const created = await this.useCase.create(validated);
            return this.parseEntity(created);
        } catch (error) {
            if (error.status) throw error;
            throw { message: error.message || 'Falha ao invalidar redação', status: 400 };
        }
    }

    public async get(essayId: number) {
        try {
            const invalidation = await this.useCase.get(essayId);
            return this.parseEntity(invalidation);
        } catch (error) {
            throw { message: error.message || 'Falha ao invalidar redação', status: 500 };
        }
    }
}