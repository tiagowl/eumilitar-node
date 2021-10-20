import Product, { ProductInterface } from "../../../entities/Product";
import { ProductRepositoryInterface, ProductCreation } from "../../Product";
import getDb from "./database";

const db = getDb();

export class ProductTestRepository implements ProductRepositoryInterface {
    private database = db.products;

    public async get(filter: Partial<ProductInterface>) {
        return this.database.find((correction => (Object.entries(filter) as [keyof ProductInterface, any][])
            .reduce((valid, [key, value]) => valid && (correction[key] === value), true as boolean))
        ) as Product;
    }

    public async create(data: ProductCreation) {
        const product = new Product({
            id: this.database.length,
            ...data,
        });
        this.database.push(product);
        return product;
    }

    public async filter(filter: Partial<ProductInterface>) {
        const fields = Object.entries(filter) as [keyof ProductInterface, any][];
        if (!fields.length) return this.database;
        return this.database.filter(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ));
    }

    public async update(id: number, data: Partial<ProductInterface>) {
        let product: Product;
        this.database = this.database.map((item) => {
            if (item.id === id) {
                Object.assign(item, data);
                product = item;
            }
            return item;
        });
        // @ts-ignore
        return product;
    }
}
