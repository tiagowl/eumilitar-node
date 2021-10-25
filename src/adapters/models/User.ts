import { Knex } from "knex";
import { UserFilter, UserPaginated, UserRepositoryInterface, UserSavingData } from "../../cases/User";
import User, { AccountPermission, AccountStatus, UserData, UserInterface } from "../../entities/User";
import Repository, { FieldsMap } from "./Repository";
import { Context } from "../interfaces";
import { SessionService } from "./Session";
import UserCreation, { Props as UserCreationProps } from '../views/UserCreation';
import crypto from 'crypto';
import { RecoveryService } from "./Recovery";
import { Filter, Paginated, Pagination } from "../../cases/interfaces";

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
    phone: string;
}

export const UserService = (db: Knex) => db<Partial<UserModel>, UserModel[]>('users');

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
    [['phone', val => !!val ? String(val) : val], ['phone', val => !!val ? String(val) : val]],
];

export default class UserRepository extends Repository<UserModel, UserData, User> implements UserRepositoryInterface {
    protected readonly fieldsMap = fieldsMap;
    protected readonly service;
    protected readonly entity;
    protected readonly searchFields;

    constructor(context: Context) {
        super(context);
        this.service = UserService;
        this.entity = User;
        this.searchFields = ['firstName', 'lastName', 'email'] as (keyof UserModel)[];
    }

    public async filter(filter: Filter<UserInterface>): Promise<Paginated<User> | User[]> {
        const { pagination, search, ...params } = filter;
        const parsedFilter = await this.toDb(params);
        const service = this.query;
        await this.paginate(service, pagination as Pagination<UserData>);
        await this.search(service, search);
        const filtered = await service.where(parsedFilter)
            .catch(async (error) => {
                this.logger.error(error);
                throw { message: 'Erro ao consultar usuários no banco de dados', status: 400 };
            });
        const users = await Promise.all(filtered.map(async data => {
            const parsedData = await this.toEntity(data);
            return new User(parsedData);
        }));
        if (!pagination) return users;
        const counting = this.query;
        await this.search(counting, search);
        const [{ count }] = await counting.where(parsedFilter).count({ count: '*' });
        const counted = Number(count);
        return {
            page: users,
            pages: Math.ceil(counted / (pagination.pageSize || 10)),
            count: counted
        };
    }

    private async writeMessage(props: UserCreationProps) {
        return `Olá ${props.user.firstName}!
        Aqui estão algumas orientações importantes, a repeito do procedimento para o envio da sua redação:\n
        ASSISTA AO VÍDEO "COMO ENVIAR SUA REDAÇÃO" QUE ESTÁ POSTADO NO MÓDULO "REDAÇÃO";\n
        Cadastre sua senha na nossa plataforma de redações
        Acesse o link para cadastrar: ${props.link}.
        Nome de usuário: ${props.user.email}
        Obs.: Este link irá expirar em ${props.expirationTime} horas. Após este prazo você terá que clicar em "Redefinir Senha" nna tela de login.\n
        Faça o upload do seu texto nos formatos .jpg, .jpeg, .gif, .png
        Utilize de preferência a aplicativo CAMSCANNER no formato JPG;
        Só é possível enviar fotos com tamanho máximo de 10 MB;
        Você conseguirá enviar apenas 2 (dois) arquivos por mês. Não tente enviar o mesmo texto mais de uma vez;
        Você receberá a correção no mesmo e-mail cadastrado na plataforma num prazo de <strong>ATÉ 2 SEMANAS após o envio</strong>;\n
        Atenciosamente,
        Equipe de suporte Eu Militar.
        `;
    }

    private async renderMessage(props: UserCreationProps) {
        return UserCreation(props);
    }

    private async generateConfirmationToken(): Promise<string> {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(32, (error, buffer) => {
                if (error) reject(error);
                else resolve(buffer.toString('hex'));
            });
        });
    }

    private async saveToken(token: string, user: User) {
        const [saved] = await RecoveryService(this.db).insert({
            token,
            expires: new Date(Date.now() + this.context.settings.messageConfig.expirationTime * 60 * 60 * 1000),
            selector: crypto.randomBytes(24).toString('hex').substring(0, 16),
            user_id: user.id,
        });
        if (typeof saved !== 'number') throw { message: 'Não foi possível salvar token', status: 500 };
    }

    private async notify(user: User) {
        try {
            const token = await this.generateConfirmationToken();
            await this.saveToken(token, user);
            const link = `${this.context.settings.messageConfig.url}${token}`;
            const props: UserCreationProps = {
                user, link,
                expirationTime: this.context.settings.messageConfig.expirationTime,
            };
            return this.context.smtp.sendMail({
                from: this.context.settings.messageConfig.sender,
                subject: 'Instruções de acesso',
                to: { email: user.email, name: user.firstName },
                text: await this.writeMessage(props),
                html: await this.renderMessage(props),
            });
        } catch (error: any) {
            this.logger.error(error);
            throw { message: 'Erro ao notificar aluno', status: 500 };
        }
    }



    public async get(filter: UserFilter) {
        try {
            const parsedFilter = await this.toDb(filter);
            const filtered = await this.query
                .where(parsedFilter).first();
            if (!filtered) return;
            const parsed = await this.toEntity(filtered);
            return new User(parsed);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao consultar usuário no banco de dados', status: 500 };
        }
    }

    public async all() {
        try {
            const users = await this.query.select('*') as UserModel[];
            return Promise.all(users.map(async user => {
                const data = await this.toEntity(user);
                return new User(data);
            }));
        } catch (error: any) {
            this.logger.error(error);
            throw { message: 'Erro ao consultar usuários no banco de dados', status: 500 };
        }
    }

    public async save(data: UserSavingData) {
        try {
            const error = new Error('Usuário não foi salvo');
            const parsedData = await this.toDb(data);
            const [saved] = await this.query.insert(parsedData);
            if (typeof saved !== 'number') throw error;
            const recovered = await this.query.where('user_id', saved).first();
            if (!recovered) throw error;
            const entityData = await this.toEntity(recovered);
            const entity = new User(entityData);
            await this.notify(entity);
            return entity;
        } catch (error: any) {
            this.logger.error(error);
            if (error.code === 'ER_DUP_ENTRY') throw { message: 'Email já está sendo utilizado', status: 400 };
            throw { message: 'Erro ao salvar no banco de dados', status: 500 };
        }
    }

    public async auth(token: string) {
        const tokenSubQuery = SessionService(this.db)
            .select('user_id').where('session_id', token);
        const user = await this.query
            .whereIn('user_id', tokenSubQuery)
            .first().catch(error => {
                this.logger.error(error);
                throw { message: 'Erro ao consultar usuário no banco de dados', status: 500 };
            });
        if (!user) throw { message: 'Token inválido', status: 400 };
        const userData = await this.toEntity(user);
        return new User(userData);
    }

    public async getUnsyncUsers() {
        return await this.query.whereNotIn('permission', [1, 5, 6]);
    }

    public async fixPermission(id: number) {
        return await this.query
            .where('user_id', id)
            .update({ permission: 6 });
    }
}

