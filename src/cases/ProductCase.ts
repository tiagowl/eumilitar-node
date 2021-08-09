import { Course } from "../entities/Product";
import Product, { ProductInterface } from "../entities/Product";

export interface ProductRepositoryInterface {
    get: (filter: Partial<ProductInterface>) => Promise<Product>;
    create: (data: ProductCreation) => Promise<Product>;
}

export interface ProductCreation {
    name: string;
    code: number;
    course: Course;
    expirationTime: number;
}

export default class ProductCase {
    private repository: ProductRepositoryInterface;

    constructor(repository: ProductRepositoryInterface) {
        this.repository = repository;
    }

    public async get(code: number) {
        return this.repository.get({ code });
    }

    public async create(data: ProductCreation) {
        return this.repository.create(data);
    }
}