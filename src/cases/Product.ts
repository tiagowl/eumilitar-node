import { Course } from "../entities/Product";
import Product, { ProductInterface } from "../entities/Product";
import { createMethod, filterMethod, getMethod, updateMethod } from "./interfaces";

export interface ProductRepositoryInterface {
    readonly get: getMethod<Product, ProductInterface>;
    readonly create: createMethod<ProductCreation, Product>;
    readonly filter: filterMethod<Product, ProductInterface>;
    readonly update: updateMethod<Product, ProductInterface>;
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

    public async get(filter: Partial<ProductInterface>) {
        return this.repository.get(filter);
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