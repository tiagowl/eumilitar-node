import knex, { Knex } from "knex";
import { RepositoryInterface } from '../../cases/interfaces'
import { UserFilter } from "../../cases/UserUseCase";
import User, { AccountPermission, AccountStatus, UserData } from "../../entities/User";

const statusMap: AccountStatus[] = ['inactive', 'active', 'pending']
const permissionMap: [number, AccountPermission][] = [
    [1, 'admin'],
    [2, 'esa'],
    [3, 'espcex'],
]

function parseStatus(value: number): AccountStatus {
    return statusMap[value];
}

function parseStatusToDB(value: AccountStatus): number {
    return statusMap.indexOf(value);
}

function parsePermission(value: number): AccountPermission {
    const parsed = permissionMap.filter(item => item[0] === value)
    return parsed[0][1]
}

function parsePermissionToDB(value: AccountPermission): number | undefined {
    const parsed = permissionMap.find(item => item[1] === value);
    return !!parsed ? parsed[0] : undefined
}

type Parser = (value: any) => any;

type FieldsMap = {
    entity: [keyof User, Parser],
    db: [keyof UserModel, Parser]
}[]

interface UserModel {
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

export const UserService = (driver: Knex) => driver<UserModel>('users')

export default class UserRepository implements RepositoryInterface<User, UserFilter> {
    protected service: Knex.QueryBuilder<UserModel>;
    protected fieldsMap: FieldsMap = [
        { entity: ['id', Number], db: ['user_id', Number] },
        { entity: ['firstName', String], db: ['first_name', String] },
        { entity: ['lastName', String], db: ['last_name', String] },
        { entity: ['email', String], db: ['email', String] },
        { entity: ['password', String], db: ['passwd', String] },
        { entity: ['status', parseStatus], db: ['status', parseStatusToDB] },
        { entity: ['permission', parsePermission], db: ['permission', parsePermissionToDB] },
        { entity: ['creationDate', Date], db: ['date_created', String] },
        { entity: ['lastModified', Date], db: ['date_modified', String] },
    ]

    constructor(driver: Knex) {
        this.service = UserService(driver);
    }

    private async filter(filter: UserFilter) {
        const params = Object.entries(filter);
        return params.reduce((driver, param: [string, any]) => {
            const entityField = param[0]
            const value = param[1]
            const field = this.fieldsMap.find(item => item.entity[0] === entityField)
            if (field) {
                const dbField = field.entity[0]
                const dbValue = field.db[1](value)
                return driver.where(dbField, dbValue)
            }
            return driver;
        }, this.service)
    }

    public async get(filter: UserFilter) {
        const filtered = await this.filter(filter)
        const user: UserModel = await filtered.first();
        if(!user) return undefined;
        return new User({
            id: user.user_id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            password: user.passwd,
            status: parseStatus(user.status),
            permission: parsePermission(user.permission),
            creationDate: user.date_created,
            lastModified: user.date_modified
        });
    }

}

