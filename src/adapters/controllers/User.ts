import { Knex } from 'knex';
import * as yup from 'yup';
import UserUseCase, { UserFilter } from '../../cases/UserUseCase';
import User from '../../entities/User';
import UserRepository from '../models/User';
import Controller from './Controller';

export interface UserInterface {
    email: string;
    password: string;
}

export type UserResponse = {
    token?: string,
    errors?: [keyof UserInterface, string][]
};

export const schema = yup.object({});

export default class UserController extends Controller<UserInterface> {
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

    public async all(filter: UserFilter) {
        const users = await this.useCase.listAll(filter);
        return Promise.all(users.map(async user => this.parseEntity(user)));
    }
}