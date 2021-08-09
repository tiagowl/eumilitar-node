import { Knex } from "knex";
import { Logger } from "winston";
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
const parserMap: FieldsMap<ProductModel, ProductInterface> = [
    [['product_id', Number], ['id', Number]],
    [['product_name', String], ['name', String]],
    [
        ['course_tag', val => (
            Object.fromEntries(courseMap)[val]
        )],
        ['course', val => {
            const parsed = courseMap.find(([_, item]) => item === val);
            if (!parsed) return 'blank';
            return parsed[0];
        }]
    ],
    [['id_hotmart', Number], ['code', Number]],
    [['expiration_time', Number], ['expirationTime', Number]]
];

export const ProductService = (driver: Knex) => driver<Partial<ProductModel>, ProductModel[]>('products');

export default class ProductRepository extends Repository<ProductModel, ProductInterface> implements ProductRepositoryInterface {

    constructor(context: Context) {
        super(parserMap, context, ProductService);
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
        const parsed = await this.toDb(filter);
        const product = await this.query
            .where(parsed).first()
            .catch((error) => {
                this.logger.error(error);
                throw { message: 'Erro ao consultar banco de dados', status: 500 };
            });
        if (!product) {
            await this.notifyAdmins(filter);
            throw { message: 'Produto não encontrado', status: 404 };
        }
        const entityData = await this.toEntity(product);
        return new Product(entityData);
    }

    public async create(data: ProductCreation) {
        const parsed = await this.toDb(data);
        const err = { message: 'Erro ao salvar produto', status: 500 };
        const [id] = await this.query.insert(parsed).catch(error => {
            this.logger.error(error);
            throw err;
        });
        if (typeof id !== 'number') throw err;
        const productData = await this.query.where('product_id', id).first()
            .catch((error) => {
                this.logger.error(error);
                throw { message: 'Erro ao consultar banco de dados', status: 500 };
            });
        if (!productData) throw err;
        const entityData = await this.toEntity(productData);
        return new Product(entityData);
    }
}