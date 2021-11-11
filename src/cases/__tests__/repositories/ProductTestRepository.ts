import Product, { ProductInterface } from "../../../entities/Product";
import { ProductRepositoryInterface, ProductCreation } from "../../ProductCase";
import { FakeDB } from "./database";
import TestRepository from "./TestRepository";

export default class ProductTestRepository extends TestRepository<Product, ProductInterface> implements ProductRepositoryInterface {

    constructor(db: FakeDB) {
        super(db, Product, 'products');
    }
}
