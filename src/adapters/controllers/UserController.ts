import * as yup from 'yup';
import UserUseCase, { UserCreation as DefaultUserCration, UserFilter, UserUpdate as DefaultUserUpdate } from '../../cases/UserCase';
import User, { AccountPermission, accountPermissions, accountStatus, AccountStatus, Permissions, UserInterface } from '../../entities/User';
import UserRepository from '../models/UserRepository';
import Controller, { paginationSchema } from './Controller';
import { Context } from '../interfaces';
import { Paginated } from '../../cases/interfaces';
import _ from 'lodash';
import { Filter } from '../../cases/interfaces';
import { Errors } from '../../cases/ErrorCase';

export interface UserResponse {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    status: AccountStatus;
    permission: AccountPermission;
    creationDate: Date;
    lastModified: Date;
}

export interface UserUpdate {
    firstName: string;
    lastName: string;
    email?: string;
    status?: AccountStatus;
    permission?: AccountPermission;
    permissions?: Permissions[];
    password?: string;
    phone?: string;
}

export interface UserCreation {
    firstName: string;
    lastName: string;
    email: string;
    status: AccountStatus;
    permission: AccountPermission;
    password: string;
    phone?: string;
    permissions?: Permissions[];
}

const updateSchemaBase = {
    firstName: yup.string().required('O campo "Nome" é obrigatório'),
    lastName: yup.string().required('O campo "Sobrenome" é obrigatório'),
    email: yup.string().email('Email inválido').required('O campo "Email" é obrigatório'),
    status: yup.string().required('O campo "Status" é obrigatório').is(accountStatus, 'Status inválido'),
    permission: yup.string().required('O campo "Permissão" é obrigatório').is(accountPermissions, 'Permissão inválida'),
    permissions: yup.mixed()
        .when('permission', {
            is: (val: any) => val === 'admin',
            then: yup.array().required('É preciso informar as permissões')
                .of(yup.string().is(Object.keys(Permissions), 'Permissão inválida'))
        })
        .transform(val => !!val ? new Set(val) : val),
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

export default class UserController extends Controller {
    private readonly repository: UserRepository;
    private readonly useCase: UserUseCase;

    constructor(context: Context) {
        super(context);
        this.repository = new UserRepository(context);
        this.useCase = new UserUseCase(this.repository);
    }

    public parseEntity = async (entity: User) => {
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
            permissions: !!entity.permissions ? [...entity.permissions] : null,
        };
    }


    public async all(filter: Filter<UserInterface>): Promise<UserResponse[] | Paginated<UserResponse>> {
        try {
            const parsedFilter = await this.castFilter(filter, filterSchema);
            const users = await this.useCase.filter(parsedFilter);
            if (users instanceof Array) {
                return await Promise.all(users.map(this.parseEntity));
            }
            return {
                ...users,
                page: await Promise.all(users.page.map(this.parseEntity))
            };
        } catch (error: any) {
            this.logger.error(error);
            throw { message: error.message || 'Erro ao consultar usuários', status: 500 };
        }
    }

    public async create(data: UserCreation) {
        try {
            const validated = await this.validate(data, schema) as unknown as DefaultUserCration;
            const created = await this.useCase.create(validated);
            return await this.parseEntity(created);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }

    public async update(id: number, data: UserUpdate, agent: User) {
        try {
            if (!agent || (agent.id !== id && agent.permission !== 'admin')) throw { message: 'Não autorizado', status: 403 };
            const validationSchema = agent.id === id ? updateProfileSchema : updateSchema;
            const validated = await this.validate(data, validationSchema) as unknown as DefaultUserUpdate;
            const updated = await this.useCase.update(id, validated);
            return await this.parseEntity(updated);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }

    public async get(id: number) {
        try {
            const user = await this.useCase.get(id);
            return await this.parseEntity(user);
        } catch (error: any) {
            this.logger.error(error);
            if (error.code === Errors.NOT_FOUND) throw { message: 'Usuário não encontrado', status: 404 };
            throw { message: error.message, status: 500 };
        }
    }
}