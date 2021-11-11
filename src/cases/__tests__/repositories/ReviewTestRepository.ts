import faker from "faker";
import Review, { ReviewInterface } from "../../../entities/Review";
import { ReviewRepositoryInterface, ReviewInsertion } from "../../Review";
import { UserRepositoryInterface } from "../../User";
import { FakeDB } from "./database";
import TestRepository from "./TestRepository";
import UserTestRepository from "./UserTestRepository";



export default class ReviewTestRepository extends TestRepository<Review, ReviewInterface> implements ReviewRepositoryInterface {

    constructor(db: FakeDB) {
        super(db, Review, 'reviews');
    }
}