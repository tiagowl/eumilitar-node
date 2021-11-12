import ReviewCase, { ReviewCreation } from "../../cases/ReviewCase";
import Review from "../../entities/Review";
import { Context } from "../interfaces";
import ReviewRepository from "../models/ReviewRepository";
import Controller from "./Controller";
import * as yup from 'yup';

const schema = yup.object().shape({
    grade: yup.number().required('O campo "nota" é obrigatório').min(1).max(10),
    user: yup.number().required('O campo "usuário" é obrigatório'),
    description: yup.string(),
});

export default class ReviewController extends Controller {
    private readonly repository: ReviewRepository;
    private readonly useCase: ReviewCase;

    constructor(context: Context) {
        super(context);
        this.repository = new ReviewRepository(context);
        this.useCase = new ReviewCase(this.repository, {
            expiration: context.settings.reviewExpiration,
        });
    }

    private async parseEntity(entity: Review) {
        return { ...entity };
    }

    public async create(data: ReviewCreation) {
        try {
            const validated = await this.validate(data, schema);
            const created = await this.useCase.create(validated);
            return await this.parseEntity(created);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async canReview(user: number) {
        try {
            const can = await this.useCase.canSend(user);
            return { can };
        } catch (error: any) {
            throw await this.processError(error);
        }
    }
}