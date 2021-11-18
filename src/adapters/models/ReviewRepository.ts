import { Knex } from "knex";
import { ReviewRepositoryInterface } from "../../cases/ReviewCase";
import { SettingsRepositoryInterface } from "../../cases/SettingsCase";
import Review, { ReviewInterface } from "../../entities/Review";
import { Context } from "../interfaces";
import Repository, { FieldsMap, prsr } from "./Repository";
import SettingsRepository from "./SettingsRepository";

export interface ReviewModel {
    readonly id: number;
    grade: number;
    registrationDate: Date;
    user: number;
    description?: string;
}

const ReviewService = (db: Knex) => db<Partial<ReviewModel>, ReviewModel[]>('reviews');

const fieldsMap: FieldsMap<ReviewModel, ReviewInterface> = [
    [['id', prsr.nb], ['id', prsr.nb]],
    [['description', prsr.st], ['description', prsr.st]],
    [['grade', prsr.nb], ['grade', prsr.nb]],
    [['registrationDate', prsr.dt], ['registrationDate', prsr.dt]],
    [['user', prsr.nb], ['user', prsr.nb]],
];

export default class ReviewRepository extends Repository<ReviewModel, ReviewInterface, Review> implements ReviewRepositoryInterface {
    protected readonly entity = Review;
    protected readonly fieldsMap = fieldsMap;
    protected readonly searchFields = [];
    protected readonly service = ReviewService;
    public readonly settings: SettingsRepositoryInterface;

    constructor(context: Context) {
        super(context);
        this.settings = new SettingsRepository(context);
    }
}