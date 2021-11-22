import ReviewCase, { ReviewChartFilter, ReviewCreation } from "../../cases/ReviewCase";
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

const chartSchema = yup.object().shape({
    grade: yup.number().nullable().min(1).max(10),
    user: yup.number().nullable(),
    registrationDate: yup.date().nullable(),
    period: yup.object({
        start: yup.date().nullable(),
        end: yup.date().nullable(),
    }),
    type: yup.string().nullable().is(['detractor', 'passive', 'promoter'])
});

export default class ReviewController extends Controller {
    private readonly repository: ReviewRepository;
    private readonly useCase: ReviewCase;

    constructor(context: Context) {
        super(context);
        this.repository = new ReviewRepository(context);
        this.useCase = new ReviewCase(this.repository);
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

    public async resultChart(filter: ReviewChartFilter) {
        try {
            const validated = await this.castFilter(filter, chartSchema);
            const chart = await this.useCase.resultChart(validated);
            return chart;
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async score(filter: ReviewChartFilter) {
        try {
            const validated = await this.castFilter(filter, chartSchema);
            const score = await this.useCase.score(validated);
            return score;
        } catch (error: any) {
            throw await this.processError(error);
        }
    }
}