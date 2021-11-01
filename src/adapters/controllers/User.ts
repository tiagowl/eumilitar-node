import * as yup from 'yup';
import UserUseCase, { UserCreation, UserFilter, UserUpdate } from '../../cases/User';
import User, { AccountPermission, accountPermissions, accountStatus, AccountStatus, UserInterface } from '../../entities/User';
import UserRepository from '../models/User';
import Controller, { paginationSchema } from './Controller';
import { Context } from '../interfaces';
import { Paginated } from '../../cases/interfaces';
import _ from 'lodash';
import { Filter } from '../../cases/interfaces';

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

const updateSchemaBase = {
    firstName: yup.string().required('O campo "Nome" é obrigatório'),
    lastName: yup.string().required('O campo "Sobrenome" é obrigatório'),
    email: yup.string().email('Email inválido').required('O campo "Email" é obrigatório'),
    status: yup.string().required('O campo "Status" é obrigatório').is(accountStatus, 'Status inválido'),
    permission: yup.string().required('O campo "Permissão" é obrigatório').is(accountPermissions, 'Permissão inválida'),
};

const updateSchema = yup.object().shape({
    ...updateSchemaBase,
    password: yup.string(),
});

const schema = yup.object().shape({
    ...updateSchemaBase,
    password: yup.string().required('O campo "Senha" é obrigatório'),
});

const updateProfileSchema = yup.object().shape({
    firstName: yup.string().required('O campo "Nome" é obrigatório'),
    lastName: yup.string().required('O campo "Sobrenome" é obrigatório'),
    phone: yup.string().required('O campo "Telefone" é obrigatório')
        .min(11, 'O telefone deve conter pelo menos 11 caracteres')
        .max(13, 'O telefone deve conter até 13 caracteres')
        .transform((val: string) => val.replace(/[^0-9]/gm, '')),
});

const filterSchema = yup.object().shape({
    id: yup.string(),
    firstName: yup.string(),
    lastName: yup.string(),
    email: yup.string(),
    status: yup.string(),
    permission: yup.string(),
    creationDate: yup.date(),
    lastModified: yup.date(),
    pagination: paginationSchema,
    search: yup.string(),
}).noUnknown();

export default class UserController extends Controller<any> {
    private readonly repository: UserRepository;
    private readonly useCase: UserUseCase;

    constructor(context: Context) {
        super(context, schema);
        this.repository = new UserRepository(context);
        this.useCase = new UserUseCase(this.repository);
    }

    static async parseEntity(entity: User) {
        return {
            id: entity.id,
            firstName: entity.firstName,
            lastName: entity.lastName,
            email: entity.email,
            status: entity.status,
            permission: entity.permission,
            creationDate: entity.creationDate,
            lastModified: entity.lastModified,
            fullName: entity.fullName,
            phone: entity.phone,
        };
    }


    public async all(filter: Filter<UserInterface>): Promise<UserResponse[] | Paginated<UserResponse>> {
        try {
            const parsedFilter = await this.castFilter(filter, filterSchema);
            const users = await this.useCase.filter(parsedFilter);
            if (users instanceof Array) {
                return await Promise.all(users.map(UserController.parseEntity));
            }
            return {
                ...users,
                page: await Promise.all(users.page.map(UserController.parseEntity))
            };
        } catch (error: any) {
            this.logger.error(error);
            throw { message: error.message || 'Erro ao consultar usuários', status: 500 };
        }
    }

    public async create(data: UserCreation) {
        try {
            const validated = await this.validate(data);
            const created = await this.useCase.create(validated);
            return await UserController.parseEntity(created);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }

    public async update(id: number, data: UserUpdate, agent: User) {
        try {
            if (agent.id !== id && agent.permission !== 'admin') throw { message: 'Não autorizado', status: 403 };
            const validationSchema = agent.id === id ? updateProfileSchema : updateSchema;
            const validated = await this.validate(data, validationSchema);
            const updated = await this.useCase.update(id, validated);
            return await UserController.parseEntity(updated);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }

    public async get(id: number) {
        try {
            const user = await this.useCase.get(id);
            return await UserController.parseEntity(user);
        } catch (error: any) {
            this.logger.error(error);
            if (error.code === 'not_found') throw { message: 'Usuário não encontrado', status: 404 };
            throw { message: error.message, status: 500 };
        }
    }
}