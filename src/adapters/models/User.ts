import { Knex } from "knex";
import { UserFilter, UserRepositoryInterface, UserSavingData } from "../../cases/UserUseCase";
import User, { AccountPermission, AccountStatus, UserData, UserInterface } from "../../entities/User";
import { Logger } from 'winston';
import Repository, { FieldsMap } from "./Repository";

const statusMap: AccountStatus[] = ['inactive', 'active', 'pending'];
const permissionMap: [number, AccountPermission][] = [
    [1, 'admin'],
    [2, 'esa'],
    [3, 'espcex'],
    [4, 'esa&espcex'],
    [5, 'corrector'],
];

function parseStatus(value: number): AccountStatus {
    return statusMap[value];
}

function parseStatusToDB(value: AccountStatus): number {
    return statusMap.indexOf(value);
}

function parsePermission(value: number): AccountPermission {
    const parsed = permissionMap.filter(item => item[0] === value);
    return parsed[0][1];
}

function parsePermissionToDB(value: AccountPermission): number | undefined {
    const parsed = permissionMap.find(item => item[1] === value);
    return !!parsed ? parsed[0] : undefined;
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


export interface UserModelFilter {
    user_id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    passwd?: string;
    status?: number;
    permission?: number;
    date_created?: Date;
    date_modified?: Date;
}

export const UserService = (driver: Knex) => driver<UserModelFilter, UserModel[]>('users');

const fieldsMap: FieldsMap<UserModel, UserData> = [
    [['user_id', Number], ['id', Number],],
    [['first_name', String], ['firstName', String],],
    [['last_name', String], ['lastName', String],],
    [['email', String], ['email', String],],
    [['passwd', String], ['password', String],],
    [['status', parseStatusToDB], ['status', parseStatus],],
    [['permission', parsePermissionToDB], ['permission', parsePermission],],
    [['date_created', (value) => new Date(value)], ['creationDate', (value) => new Date(value)],],
    [['date_modified', (value) => new Date(value)], ['lastModified', (value) => new Date(value)],],
];

export default class UserRepository extends Repository<UserModel, UserData> implements UserRepositoryInterface {
    private service: Knex.QueryBuilder<UserModelFilter, UserModel[]>;

    constructor(driver: Knex, logger: Logger) {
        super(fieldsMap, logger, driver);
        this.service = UserService(driver);
    }

    get query() { return this.service; }

    private async _filter(filter: UserFilter): Promise<Knex.QueryBuilder> {
        return this.service.where(await this.toDb(filter));
    }

    public async filter(filter: UserFilter) {
        const parsedFilter = await this.toDb(filter);
        const filtered = await UserService(this.driver).where(parsedFilter);
        return Promise.all(filtered.map(async data => {
            const parsedData = await this.toEntity(data);
            return new User(parsedData);
        }));
    }

    public async update(id: number, data: UserFilter) {
        try {
            const parsedData = await this.toDb(data);
            return UserService(this.driver).where('user_id', id).update(parsedData);
        } catch (error) {
            this.logger.error(error);
            throw { message: 'Falha ao gravar no banco de dados', status: 500 };
        }
    }

    public async get(filter: UserFilter) {
        try {
            const parsedFilter = await this.toDb(filter);
            const filtered = await UserService(this.driver)
                .where(parsedFilter).first();
            if (!!filtered) {
                const parsed = await this.toEntity(filtered);
                return new User(parsed);
            }
            throw { message: 'Usuário não encontrado', status: 404 };
        } catch (error) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao consultar banco de dados', status: 500 };
        }
    }

    public async all() {
        try {
            const users = await this.service.select('*') as UserModel[];
            return Promise.all(users.map(async user => new User(await this.toEntity(user))));
        } catch (error) {
            this.logger.error(error);
            throw { message: 'Erro ao consultar banco de dados', status: 500 };
        }
    }

    public async save(data: UserSavingData) {
        try {
            const error = new Error('Usuário não foi salvo');
            const parsedData = await this.toDb(data);
            const [saved] = await UserService(this.driver).insert(parsedData);
            if (saved) throw error;
            const recovered = await UserService(this.driver).where('user_id', saved).first();
            if (!recovered) throw error;
            const entityData = await this.toEntity(recovered);
            return new User(entityData);
        } catch (error) {
            throw { message: 'Erro ao salvar no banco de dados', status: 500 };
        }
    }

}

