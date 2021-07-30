import { Knex } from "knex";
import { UserFilter, UserRepositoryInterface, UserSavingData } from "../../cases/UserUseCase";
import User, { AccountPermission, AccountStatus, UserData, UserInterface } from "../../entities/User";
import Repository, { FieldsMap } from "./Repository";
import { Context } from "../interfaces";
import { TokenService } from "./Token";

const statusMap: AccountStatus[] = ['inactive', 'active', 'pending'];
const permissionMap: [number, AccountPermission][] = [
    [1, 'admin'],
    [5, 'corrector'],
    [6, 'student'],
];

function parseStatus(value: number): AccountStatus {
    return statusMap[value];
}

function parseStatusToDB(value: AccountStatus): number {
    return statusMap.indexOf(value);
}

function parsePermission(value: number): AccountPermission {
    const parsed = permissionMap.find(item => item[0] === value);
    if (!parsed) throw { message: `Permissão '${value}' inválida`, status: 400 };
    return parsed[1];
}

function parsePermissionToDB(value: AccountPermission): number | undefined {
    const parsed = permissionMap.find(item => item[1] === value);
    if (!parsed) throw { message: `Permissão '${value}' inválida`, status: 400 };
    return parsed[0];
}

export interface UserModel {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    passwd: string;
    status: number;
    permission: number;
    date_created: Date;
    date_modified: Date;
}

export const UserService = (driver: Knex) => driver<Partial<UserModel>, UserModel[]>('users');

const fieldsMap: FieldsMap<UserModel, UserData> = [
    [['user_id', Number], ['id', Number]],
    [['first_name', String], ['firstName', String]],
    [['last_name', String], ['lastName', String]],
    [['email', String], ['email', String]],
    [['passwd', String], ['password', String]],
    [['status', parseStatusToDB], ['status', parseStatus]],
    [['permission', parsePermissionToDB], ['permission', parsePermission]],
    [['date_created', (value) => new Date(value)], ['creationDate', (value) => new Date(value)]],
    [['date_modified', (value) => new Date(value)], ['lastModified', (value) => new Date(value)]],
];

export default class UserRepository extends Repository<UserModel, UserData> implements UserRepositoryInterface {

    constructor(context: Context) {
        super(fieldsMap, context, UserService);
    }

    get query() { return UserService(this.driver); }

    public async filter(filter: UserFilter) {
        const parsedFilter = await this.toDb(filter);
        const filtered = await this.query.where(parsedFilter)
            .catch(async (error) => {
                this.logger.error(error);
                throw { message: 'Erro ao consultar banco de dados', status: 400 };
            });
        return Promise.all(filtered.map(async data => {
            const parsedData = await this.toEntity(data);
            return new User(parsedData);
        }));
    }

    public async update(id: number, data: UserFilter) {
        try {
            const parsedData = await this.toDb(data);
            return this.query.where('user_id', id).update(parsedData);
        } catch (error) {
            this.logger.error(error);
            throw { message: 'Falha ao gravar no banco de dados', status: 500 };
        }
    }

    public async get(filter: UserFilter) {
        try {
            const parsedFilter = await this.toDb(filter);
            const filtered = await this.query
                .where(parsedFilter).first();
            if (!filtered) throw { message: 'Usuário não encontrado', status: 404 };
            const parsed = await this.toEntity(filtered);
            return new User(parsed);
        } catch (error) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao consultar banco de dados', status: 500 };
        }
    }

    public async all() {
        try {
            const users = await this.query.select('*') as UserModel[];
            return Promise.all(users.map(async user => {
                const data = await this.toEntity(user);
                return new User(data);
            }));
        } catch (error) {
            this.logger.error(error);
            throw { message: 'Erro ao consultar banco de dados', status: 500 };
        }
    }

    public async save(data: UserSavingData) {
        try {
            const error = new Error('Usuário não foi salvo');
            const parsedData = await this.toDb(data);
            const [saved] = await this.query.insert(parsedData);
            if (saved) throw error;
            const recovered = await this.query.where('user_id', saved).first();
            if (!recovered) throw error;
            const entityData = await this.toEntity(recovered);
            return new User(entityData);
        } catch (error) {
            throw { message: 'Erro ao salvar no banco de dados', status: 500 };
        }
    }

    public async auth(token: string) {
        const tokenSubQuery = TokenService(this.driver).select('user_id').where('session_id', token);
        const user = await this.query
            .whereIn('user_id', tokenSubQuery)
            .first().catch(error => {
                this.logger.error(error);
                throw { message: 'Erro ao consultar banco de dados', status: 500 };
            });
        if (!user) throw new Error('Token inválido');
        const userData = await this.toEntity(user);
        return new User(userData);
    }

}

