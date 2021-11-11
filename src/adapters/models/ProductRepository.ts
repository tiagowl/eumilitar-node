import { Knex } from "knex";
import { ProductCreation, ProductRepositoryInterface } from "../../cases/ProductCase";
import Product, { ProductInterface, Course } from "../../entities/Product";
import { Context } from "../interfaces";
import Repository, { FieldsMap } from "./Repository";

export interface ProductModel {
    product_id: number;
    product_name: string;
    course_tag: number;
    id_hotmart: number;
    expiration_time: number;
}

const courseMap: [Course, number][] = [
    ['esa', 2],
    ['espcex', 3],
];

export const courseTagParser = (val: Course) => (
    Object.fromEntries(courseMap)[val]
);
export const courseParser = (val: 2 | 3) => {
    const parsed = courseMap.find(([_, item]) => item === val);
    if (!parsed) return 'blank';
    return parsed[0];
};

const fieldsMap: FieldsMap<ProductModel, ProductInterface> = [
    [['product_id', Number], ['id', Number]],
    [['product_name', String], ['name', String]],
    [['course_tag', courseTagParser], ['course', courseParser]],
    [['id_hotmart', Number], ['code', Number]],
    [['expiration_time', Number], ['expirationTime', Number]]
];

export const ProductService = (db: Knex) => db<Partial<ProductModel>, ProductModel[]>('products');

export default class ProductRepository extends Repository<ProductModel, ProductInterface, Product> implements ProductRepositoryInterface {
    protected readonly fieldsMap;
    protected readonly service;
    protected readonly entity;
    protected readonly searchFields = [];

    constructor(context: Context) {
        super(context);
        this.fieldsMap = fieldsMap;
        this.service = ProductService;
        this.entity = Product;
    }

    private async writeMessage(filter: Partial<ProductInterface>) {
        return `Produto não cadastrado: ${JSON.stringify(filter)}`;
    }

    private async notifyAdmins(filter: Partial<ProductInterface>) {
        return this.context.smtp.sendMail({
            to: { email: this.context.settings.messageConfig.adminMail, name: 'Admin' },
            from: this.context.settings.messageConfig.sender,
            subject: 'Produto não cadastrado',
            text: await this.writeMessage(filter),
        });
    }

    public async get(filter: Partial<ProductInterface>) {
        const product = await super.get(filter);
        if (!product) {
            await this.notifyAdmins(filter);
            throw { message: 'Produto não encontrado', status: 404 };
        }
        return product;
    }

}