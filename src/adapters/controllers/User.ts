import * as yup from 'yup';
import UserUseCase, { UserCreation, UserFilter } from '../../cases/UserUseCase';
import User, { AccountPermission, accountPermissions, accountStatus, AccountStatus } from '../../entities/User';
import UserRepository from '../models/User';
import Controller from './Controller';
import { Context } from '../interfaces';
import { Paginated } from '../../cases/interfaces';

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

const schema = yup.object().shape({
    firstName: yup.string().required('O campo "Nome" é obrigatório'),
    lastName: yup.string().required('O campo "Sobrenome" é obrigatório'),
    email: yup.string().required('O campo "Email" é obrigatório'),
    status: yup.string().required('O campo "Status" é obrigatório').is(accountStatus, 'Status inválido'),
    permission: yup.string().required('O campo "Permissão" é obrigatório').is(accountPermissions, 'Permissão inválida'),
    password: yup.string().required('O campo "Senha" é obrigatório'),
});

export default class UserController extends Controller<any> {
    private readonly repository: UserRepository;
    private readonly useCase: UserUseCase;

    constructor(context: Context) {
        super(context, schema);
        this.repository = new UserRepository(context);
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

    public async all(filter: UserFilter): Promise<UserResponse[] | Paginated<UserResponse>> {
        try {
            const users = await this.useCase.listAll(filter);
            if (users instanceof Array) {
                return Promise.all(users.map(async user => this.parseEntity(user)));
            }
            return {
                ...users,
                page: await Promise.all(users.page.map(async user => this.parseEntity(user)))
            };
        } catch (error) {
            this.logger.error(error);
            throw { message: error.message || 'Erro ao consultar usuários', status: 500 };
        }
    }

    public async create(data: UserCreation) {
        try {
            const validated = await this.validate(data);
            const created = await this.useCase.create(validated);
            return this.parseEntity(created);
        } catch (error) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }
}