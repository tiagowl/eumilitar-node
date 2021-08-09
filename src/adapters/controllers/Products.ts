import Controller from "./Controller";
import ProductCase, { ProductCreation } from '../../cases/ProductCase';
import * as yup from 'yup';
import { Context } from "../interfaces";
import ProductRepository from "../models/Product";
import Product from "../../entities/Product";

const schema = yup.object().shape({
    name: yup.string().required('O campo "nome" é obrigatório'),
    code: yup.number().required('O campo "código" é obrigatório'),
    course: yup.string().required('O campo "curso" é obrigatório').is(['esa', 'espcex']),
    expirationTime: yup.number().required('O campo "prazo de expiração" é obrigatório'),
});

export default class ProductController extends Controller<ProductCreation> {
    private useCase: ProductCase;
    private repository: ProductRepository;

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
            return this.parseEntity(created);
        } catch (error) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 400 };
        }
    }
}