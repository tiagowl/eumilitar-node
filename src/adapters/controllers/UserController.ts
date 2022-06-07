import * as yup from 'yup';
import UserUseCase, { UserCreation as DefaultUserCration, UserFilter, UserUpdate as DefaultUserUpdate } from '../../cases/UserCase';
import User, { AccountPermission, accountPermissions, accountStatus, AccountStatus, Permissions, UserInterface } from '../../entities/User';
import UserRepository from '../models/UserRepository';
import Controller, { paginationSchema } from './Controller';
import { Context } from '../interfaces';
import { ChartFilter, Paginated } from '../../cases/interfaces';
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
    file?: Express.MulterS3.File;
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
    file: yup.object(),
    email: yup.string().email('Email inválido'),
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
    file: yup.object()
});

const baseFilterSchema = {
    id: yup.string(),
    firstName: yup.string(),
    lastName: yup.string(),
    email: yup.string(),
    status: yup.string(),
    permission: yup.string(),
    creationDate: yup.date(),
    lastModified: yup.date(),
};

const filterSchema = yup.object().shape({
    ...baseFilterSchema,
    pagination: paginationSchema,
    search: yup.string(),
}).noUnknown();

const chartFilterSchema = yup.object().shape({
    ...baseFilterSchema,
    period: yup.object().shape({
        start: yup.date(),
        end: yup.date(),
    }),
});

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
            availableSends: await this.repository.availableSends(entity.id),
            avatar_url: entity.avatar_url
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
            throw await this.processError(error);
        }
    }

    public async reSendMail(user: User){
        this.repository.notify(user);
    }

    public async create(data: UserCreation, agent: User) {
        try {
            const unalthorizedError = { message: 'Não autorizado', status: 403 };
            const isAdmin = agent.permission !== 'admin';
            if (isAdmin) {
                if (!agent.permissions.has(Permissions.CREATE_STUDENTS) && data.permission === 'student') throw unalthorizedError;
                if (!agent.permissions.has(Permissions.CREATE_USERS) && data.permission !== 'student') throw unalthorizedError;
            }
            const validated = await this.validate(data, schema) as unknown as DefaultUserCration;
            console.log(`Email validado: ${validated.email}`);
            const created = await this.useCase.create(validated);
            return await this.parseEntity(created);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async update(id: number, data: UserUpdate, agent: User) {
        console.log(`Foto: ${data.file?.location}`);
        try {
            const unalthorizedError = { message: 'Não autorizado', status: 403 };
            const isSelf = agent.id === id;
            const isAdmin = agent.permission !== 'admin';
            const usePermission = !isSelf && isAdmin;
            if (!agent || (!isSelf && isAdmin)) throw unalthorizedError;
            if (usePermission) {
                if (!agent.permissions.has(Permissions.UPDATE_USER_PASSWORD) && data.password) throw unalthorizedError;
                if (!agent.permissions.has(Permissions.UPDATE_STUDENTS) && data.permission === 'student') throw unalthorizedError;
                if (!agent.permissions.has(Permissions.CREATE_USERS) && data.permission !== 'student') throw unalthorizedError;
            }
            const validationSchema = isSelf ? updateProfileSchema : updateSchema;
            const validated = await this.validate(data, validationSchema) as unknown as DefaultUserUpdate;
            const updated = await this.useCase.update(id, {...validated, file: data.file?.location || data.file?.path});
            return await this.parseEntity(updated);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async get(id: number) {
        try {
            const user = await this.useCase.get(id);
            return await this.parseEntity(user);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async hasPermissions(user: User, permissions: Permissions[]) {
        try {
            return await this.useCase.hasPermissions(user, permissions);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async sentEssaysChart(filter: ChartFilter<UserInterface> = {}) {
        try {
            const parsed = await this.castFilter(filter, chartFilterSchema);
            const chart = await this.useCase.sentEssaysChart(parsed);
            return chart;
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async getUserSends(userId: number){
        const sends = await this.repository.sends(userId);
        if(!sends){
            return []
        }
        return sends;
    }

    public async countEssaySentByUser(filter: ChartFilter<UserInterface> = {}) {
        try {
            const parsed = await this.castFilter(filter, chartFilterSchema);
            const data = await this.useCase.countEssaySentByUser(parsed);
            const parsedData = await Promise.all(data.map(async user => ({
                'Nome': user.fullName,
                'Telefone': user.phone,
                'Email': user.email,
                'Redações Enviadas': user.sentEssays,
            })));
            return await this.generateSheet(parsedData, 'Redações enviadas por aluno');
        } catch (error: any) {
            throw await this.processError(error);
        }
    }
}