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

export const schema = yup.object({});

export default class UserController extends Controller<any> {
    private repository: UserRepository;
    private useCase: UserUseCase;

    constructor(driver: Knex) {
        super(schema, driver);
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
}