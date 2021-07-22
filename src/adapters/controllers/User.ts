import { Knex } from 'knex';
import * as yup from 'yup';
import UserUseCase, { UserFilter } from '../../cases/UserUseCase';
import User, { AccountPermission, AccountStatus } from '../../entities/User';
import UserRepository from '../models/User';
import Controller from './Controller';
import { Logger } from 'winston';
import { Context } from '../interfaces';

export type UserResponse = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    status: AccountStatus;
    permission: AccountPermission;
    creationDate: Date;
    lastModified: Date;
};

export interface CancelData {
    hottok: string;
    subscriptionId: number;
    subscriberCode: string;
    cancellationDate: number;
    dateNextCharge: number;
    actualRecurrenceValue: number;
    userName: string;
    userEmail: string;
    productName: string;
    subscriptionPlanName: string;
}

export interface OrderData {
    hottok: string;
    prod: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
}


export default class UserController extends Controller<any> {
    private repository: UserRepository;
    private useCase: UserUseCase;
    private cancelSchema: yup.ObjectSchema<any>;

    constructor(context: Context) {
        const { settings: { hotmart: { hottok } } } = context;
        const schema = yup.object().shape({
            hottok: yup.string().required('O campo "hottok" é obrigatório').is([hottok], '"hottok" inválido'),
            prod: yup.number().required(),
            first_name: yup.string().required(),
            last_name: yup.string().required(),
            email: yup.string().required(),
            status: yup.string().required(),
        });
        super(context, schema);
        this.cancelSchema = yup.object({
            hottok: yup.string().required('O campo "hottok" é obrigatório').is([hottok], '"hottok" inválido'),
            subscriptionId: yup.number().required('O campo "subscriptionId" é obrigatório'),
            subscriberCode: yup.string().required('O campo "subscriberCode" é obrigatório'),
            cancellationDate: yup.number().required('O campo "cancellationDate" é obrigatório'),
            dateNextCharge: yup.number().required('O campo "dateNextCharge" é obrigatório'),
            actualRecurrenceValue: yup.number().required('O campo "actualRecurrenceValue" é obrigatório'),
            userName: yup.string().required('O campo "userName" é obrigatório'),
            userEmail: yup.string().required('O campo "userEmail" é obrigatório'),
            productName: yup.string().required('O campo "productName" é obrigatório'),
            subscriptionPlanName: yup.string().required('O campo "subscriptionPlanName" é obrigatório'),
        });
        this.repository = new UserRepository(context.driver, context.logger);
        this.useCase = new UserUseCase(this.repository);
    }

    private async parseEntity(entity: User) {
        return {
            id: entity.id,
            firstName: entity.firstName,
            lastName: entity.lastName,
            email: entity.email,
            status: entity.status,
            permission: entity.permission,
            creationDate: entity.creationDate,
            lastModified: entity.lastModified,
        };
    }

    public async all(filter: UserFilter): Promise<UserResponse[]> {
        try {
            const users = await this.useCase.listAll(filter);
            return Promise.all(users.map(async user => this.parseEntity(user)));
        } catch (error) {
            this.logger.error(error);
            throw { message: 'Erro ao consultar usuários', status: 500 };
        }
    }

    public async cancel(data: CancelData) {
        try {
            const { userEmail } = await this.cancelSchema.validate(data) as CancelData;
            const success = await this.useCase.cancel(userEmail);
            return { success: !!success };
        } catch (error) {
            this.logger.error(error);
            throw {
                message: error.message || "Requisição inválida",
                status: error.status || 400
            };
        }
    }

    public async create(data: OrderData) {
        try {
            const validated = await this.validate(data);
            // const saved = await this.useCase.create({
            //     email: validated.email,
            //     firstName: validated.first_name,
            //     lastName: validated.last_name,
            //     permission: validated.prod,
            // })
        } catch (error) {
            this.logger.error(error);
        }
    }
}