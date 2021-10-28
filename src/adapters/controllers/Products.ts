import Controller from "./Controller";
import ProductCase, { ProductCreation } from '../../cases/Product';
import * as yup from 'yup';
import { Context } from "../interfaces";
import ProductRepository from "../models/Product";
import Product, { courses } from "../../entities/Product";

const schema = yup.object().shape({
    name: yup.string().required('O campo "nome" é obrigatório'),
    code: yup.number().required('O campo "código" é obrigatório'),
    course: yup.string().required('O campo "curso" é obrigatório').is(courses),
    expirationTime: yup.number().required('O campo "prazo de expiração" é obrigatório'),
});

export default class ProductController extends Controller<ProductCreation> {
    private readonly useCase: ProductCase;
    private readonly repository: ProductRepository;

    constructor(context: Context) {
        super(context, schema);
        this.repository = new ProductRepository(context);
        this.useCase = new ProductCase(this.repository);
    }

    private async parseEntity(entity: Product) {
        return { ...entity };
    }

    public async create(data: ProductCreation) {
        try {
            const validated = await this.validate(data);
            const created = await this.useCase.create(validated);
            return await this.parseEntity(created);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 400 };
        }
    }

    public async list() {
        try {
            const products = await this.useCase.list({}) as Product[];
            return Promise.all(products.map(async product => this.parseEntity(product)));
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }

    public async fullUpdate(id: number, data: ProductCreation) {
        try {
            const validated = await this.validate(data);
            const product = await this.useCase.update(id, validated);
            return await this.parseEntity(product);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }
}