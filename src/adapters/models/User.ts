import { Knex } from "knex";
import { UserFilter, UserRepositoryInterface } from "../../cases/UserUseCase";
import User, { AccountPermission, AccountStatus, UserData } from "../../entities/User";
import { Logger } from 'winston';

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

type Parser = (value: any) => any;

type FieldsMap = {
    entity: [keyof UserData, Parser],
    db: [keyof UserModel, Parser]
}[];

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

export const UserService = (driver: Knex) => driver<UserModelFilter, UserModel>('users');

export default class UserRepository implements UserRepositoryInterface {
    private service: Knex.QueryBuilder<UserModelFilter, UserModel>;
    private logger: Logger;
    private fieldsMap: FieldsMap = [
        { entity: ['id', Number], db: ['user_id', Number] },
        { entity: ['firstName', String], db: ['first_name', String] },
        { entity: ['lastName', String], db: ['last_name', String] },
        { entity: ['email', String], db: ['email', String] },
        { entity: ['password', String], db: ['passwd', String] },
        { entity: ['status', parseStatus], db: ['status', parseStatusToDB] },
        { entity: ['permission', parsePermission], db: ['permission', parsePermissionToDB] },
        { entity: ['creationDate', (value) => new Date(value)], db: ['date_created', (value) => new Date(value)] },
        { entity: ['lastModified', (value) => new Date(value)], db: ['date_modified', (value) => new Date(value)] },
    ];
    private driver: Knex;

    get query() { return this.service; }

    constructor(driver: Knex, logger: Logger) {
        this.service = UserService(driver);
        this.logger = logger;
        this.driver = driver;
    }

    private async toDb(filter: UserFilter) {
        const args = Object.entries(filter);
        const parsedParams: UserModelFilter = {};
        return args.reduce((params, param: [string, any]) => {
            const entityField = param[0];
            const value = param[1];
            const field = this.fieldsMap.find(item => item.entity[0] === entityField);
            if (field) {
                const dbField = field.db[0];
                const dbValue = field.db[1](value);
                params[dbField] = dbValue;
                return params;
            }
            return params;
        }, parsedParams);
    }

    public async toEntity(user: UserModel) {
        const fields: [keyof UserModel, any][] = Object.entries(user) as [keyof UserModel, any][];
        const data: UserData = fields.reduce((previous, field) => {
            const entityField = this.fieldsMap.find(item => item.db[0] === field[0])?.entity;
            if (entityField) {
                const [name, parser] = entityField;
                previous[name] = parser(field[1]) as never;
            }
            return previous;
        }, {} as UserData);
        return new User(data);
    }

    private async _filter(filter: UserFilter) {
        return this.service.where(await this.toDb(filter));
    }

    public async filter(filter: UserFilter) {
        this._filter(filter);
        return this;
    }

    public async update(data: UserFilter) {
        try {
            const parsedData = await this.toDb(data);
            return this.service.update(parsedData);
        } catch (error) {
            this.logger.error(error);
            throw { message: 'Falha ao gravar no banco de dados', status: 500 };
        }
    }

    public async get(filter: UserFilter) {
        const parsedFilter = await this.toDb(filter);
        const user = await UserService(this.driver).where(parsedFilter).first()
            .catch((error) => {
                this.logger.error(error);
                throw { message: 'Erro ao consultar banco de dados', status: 500 };
            });
        if (!user) throw { message: 'Usuário não encontrado' };
        return this.toEntity(user);
    }

    public async all() {
        try {
            const users = await this.service.select('*') as UserModel[];
            return Promise.all(users.map(async user => this.toEntity(user)));
        } catch (error) {
            this.logger.error(error);
            throw { message: 'Erro ao consultar banco de dados', status: 500 };
        }
    }

}

