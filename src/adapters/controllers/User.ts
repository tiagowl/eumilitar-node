import { Knex } from 'knex';
import * as yup from 'yup';
import UserUseCase, { UserFilter } from '../../cases/UserUseCase';
import User, { AccountPermission, AccountStatus } from '../../entities/User';
import UserRepository from '../models/User';
import Controller from './Controller';


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

export const schema = yup.object().shape({});

export default class UserController extends Controller<any> {
    private repository: UserRepository;
    private useCase: UserUseCase;
    private cancelSchema: yup.ObjectSchema<any>;

    constructor(driver: Knex, hottok?: string) {
        super(schema, driver);
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
        this.repository = new UserRepository(driver);
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
        const users = await this.useCase.listAll(filter);
        return Promise.all(users.map(async user => this.parseEntity(user)));
    }

    public async cancel(data: CancelData) {
        try {
            const validatedData = await this.cancelSchema.validate(data) as CancelData;
            await this.useCase.cancel(validatedData.userEmail);
            return { success: true };
        } catch (error) {
            throw {
                message: error.message || "Requisição inválida",
                status: error.status || 400
            };
        }
    }
}