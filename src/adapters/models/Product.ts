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

const parserMap: FieldsMap<ProductModel, ProductInterface> = [
    [['product_id', Number], ['id', Number]],
    [['product_name', String], ['name', String]],
    [['course_tag', courseTagParser], ['course', courseParser]],
    [['id_hotmart', Number], ['code', Number]],
    [['expiration_time', Number], ['expirationTime', Number]]
];

export const ProductService = (db: Knex) => db<Partial<ProductModel>, ProductModel[]>('products');

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
            if (typeof filter.code === 'number') await this.notifyAdmins(filter);
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

    public async filter(filter: Partial<ProductInterface>) {
        const parsed = await this.toDb(filter);
        const filtered = await this.query.where(parsed)
            .catch(error => {
                this.logger.error(error);
                throw { message: 'Erro ao consultar banco de dados', status: 500 };
            });
        return Promise.all(filtered.map(async item => {
            const data = await this.toEntity(item);
            return new Product(data);
        }));
    }

    public async update(id: number, data: Partial<ProductInterface>) {
        const parsed = await this.toDb(data);
        const updated = await this.query.where('product_id', id).update(parsed)
            .catch(error => {
                this.logger.error(error);
                throw { message: 'Erro ao atualizar produto', status: 500 };
            });
        if (updated > 1) throw { message: `${updated} registros afetados`, status: 500 };
        if (updated === 0) throw { message: 'Erro ao atualizar produto', status: 500 };
        return this.get({ id: data.id || id });
    }
}