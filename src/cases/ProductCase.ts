import Product, { ProductInterface } from "../entities/Product";


export interface ProductRepositoryInterface {
    get: (filter: Partial<ProductInterface>) => Promise<Product>;
}

export default class ProductCase {
    private repository: ProductRepositoryInterface;

    constructor(repository: ProductRepositoryInterface) {
        this.repository = repository;
    }

    public async get(code: number) {
        return this.repository.get({ code });
    }
}