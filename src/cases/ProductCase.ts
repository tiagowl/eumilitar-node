import { Course } from "../entities/Product";
import Product, { ProductInterface } from "../entities/Product";

export interface ProductRepositoryInterface {
    readonly get: (filter: Partial<ProductInterface>) => Promise<Product>;
    readonly create: (data: ProductCreation) => Promise<Product>;
    readonly filter: (filter: Partial<ProductInterface>) => Promise<Product[]>;
    readonly update: (id: number, data: Partial<ProductInterface>) => Promise<Product>;
}

export interface ProductCreation {
    name: string;
    code: number;
    course: Course;
    expirationTime: number;
}

export default class ProductCase {
    private readonly repository: ProductRepositoryInterface;

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