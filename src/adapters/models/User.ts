import { Knex } from "knex";
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


interface UserModelFilter {
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

    private async toDb(filter: UserFilter) {
        const args = Object.entries(filter);
        const parsedParams: UserModelFilter = {}
        return args.reduce((params, param: [string, any]) => {
            const entityField = param[0]
            const value = param[1]
            const field = this.fieldsMap.find(item => item.entity[0] === entityField)
            if (field) {
                const dbField = field.db[0]
                const dbValue = field.db[1](value)
                params[dbField] = dbValue
                return params;
            }
            return params;
        }, parsedParams)
    }

    private async filter(filter: UserFilter): Promise<Knex.QueryBuilder> {
        const filtered = this.service.where(await this.toDb(filter)).select('*')
        return filtered
    }

    public async get(filter: UserFilter) {
        const filtered: any = this.filter(filter)
        return new Promise<User>((accept, reject) => {
            filtered.then((user: UserModel[]) => {
                if (!user[0]) reject(undefined);
                accept(new User({
                    id: user[0].user_id,
                    firstName: user[0].first_name,
                    lastName: user[0].last_name,
                    email: user[0].email,
                    password: user[0].passwd,
                    status: parseStatus(user[0].status),
                    permission: parsePermission(user[0].permission),
                    creationDate: user[0].date_created,
                    lastModified: user[0].date_modified
                }));
            });
        })
    }

}
