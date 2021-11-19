import faker from "faker";
import Review, { ReviewInterface } from "../../../entities/Review";
import { ReviewRepositoryInterface, ReviewInsertion } from "../../ReviewCase";
import { SettingsRepositoryInterface } from "../../SettingsCase";
import { UserRepositoryInterface } from "../../UserCase";
import { FakeDB } from "./database";
import SettingsTestRepository from "./SettingsTestRepository";
import TestRepository from "./TestRepository";
import UserTestRepository from "./UserTestRepository";



export default class ReviewTestRepository extends TestRepository<Review, ReviewInterface> implements ReviewRepositoryInterface {
    public readonly settings: SettingsRepositoryInterface;

    constructor(db: FakeDB) {
        super(db, Review, 'reviews');
        this.settings = new SettingsTestRepository(db);
    }
}