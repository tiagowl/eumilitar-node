import { Course } from "../entities/Product";
import Product, { ProductInterface } from "../entities/Product";

export interface ProductRepositoryInterface {
    get: (filter: Partial<ProductInterface>) => Promise<Product>;
    create: (data: ProductCreation) => Promise<Product>;
    filter: (filter: Partial<ProductInterface>) => Promise<Product[]>;
    update: (id: number, data: Partial<ProductInterface>) => Promise<Product>;
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

    public async list(filter: Partial<ProductInterface>) {
        return this.repository.filter(filter);
    }
    public async update(id: number, data: Partial<ProductInterface>) {
        return this.repository.update(id, data);
    }
}