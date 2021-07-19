import { Knex } from "knex";
import { Logger } from "winston";
import { ProductRepositoryInterface } from "../../cases/ProductCase";
import Product, { ProductInterface, Course } from "../../entities/Product";
import Repository, { FieldsMap } from "./Repository";

export interface ProductModel {
    product_id: number;
    product_name: string;
    course_tag: number;
    id_hotmart: number;
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
];

export const ProductService = (driver: Knex) => driver<Partial<ProductModel>, ProductModel>('products');

export default class ProductRepository extends Repository<ProductModel, ProductInterface> implements ProductRepositoryInterface {
    private service: Knex.QueryBuilder<Partial<ProductModel>, ProductModel>;
    private logger: Logger;
    private driver: Knex;

    constructor(driver: Knex, logger: Logger) {
        super(parserMap);
        this.service = ProductService(driver);
        this.driver = driver;
        this.logger = logger;
    }

    public async get(code: number) {
        const error = (error: Error) => {
            this.logger.error(error);
            throw { message: 'Erro ao processar dados', status: 500 };
        }
        const parsed = await this.toDb({ code })
            .catch(error);
        const product = await ProductService(this.driver)
            .where(parsed).first()
            .catch((error) => {
                this.logger.error(error);
                throw { message: 'Erro ao consultar banco de dados', status: 500 };
            });
        if (!product) throw { message: 'Produto não encontrado', status: 404 };
        const entityData = await this.toEntity(product).catch(error);
        return new Product(entityData);
    }
}