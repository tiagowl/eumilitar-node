import { Knex } from "knex";
import { UserFilter, UserPaginated, UserRepositoryInterface, UserSavingData } from "../../cases/UserCase";
import User, { AccountPermission, AccountStatus, UserData, UserInterface } from "../../entities/User";
import Repository, { FieldsMap, prsr } from "./Repository";
import { Context } from "../interfaces";
import { SessionService } from "./SessionRepository";
import UserCreation, { Props as UserCreationProps } from '../views/UserCreation';
import crypto from 'crypto';
import { RecoveryService } from "./RecoveryRepository";
import { ChartFilter, Filter, Paginated, Pagination } from "../../cases/interfaces";
import { SubscriptionService } from "./SubscriptionRepository";
import { EssayService } from "./EssayRepository";

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
    permissions?: string;
}

export const UserService = (db: Knex) => db<Partial<UserModel>, UserModel[]>('users');

const fieldsMap: FieldsMap<UserModel, UserData> = [
    [['user_id', prsr.number], ['id', prsr.number]],
    [['first_name', prsr.string], ['firstName', prsr.string]],
    [['last_name', prsr.string], ['lastName', prsr.string]],
    [['email', prsr.string], ['email', prsr.string]],
    [['passwd', prsr.string], ['password', prsr.string]],
    [['status', parseStatusToDB], ['status', parseStatus]],
    [['permission', parsePermissionToDB], ['permission', parsePermission]],
    [['date_created', prsr.date], ['creationDate', prsr.date]],
    [['date_modified', prsr.date], ['lastModified', prsr.date]],
    [['phone', prsr.string], ['phone', prsr.string]],
    [['permissions', prsr.set], ['permissions', prsr.set]],
];

export default class UserRepository extends Repository<UserModel, UserData, User> implements UserRepositoryInterface {
    protected readonly fieldsMap = fieldsMap;
    protected readonly service;
    protected readonly entity;
    protected readonly searchFields: (keyof UserModel)[];

    constructor(context: Context) {
        super(context);
        this.service = UserService;
        this.entity = User;
        this.searchFields = ['first_name', 'last_name', 'email'];
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
        const users = await Promise.all(filtered.map(async data => this.toEntity(data)));
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

    public async notify(user: User) {
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

    public async availableSends(userId: number){
        const sends = await this.sends(userId);
        const availableSends = sends.filter((send)=>{
            let today = new Date();
            return send.sent_date === null && send.expiration > today;
        });
        return availableSends;
    }

    public async sends(userId: number){
        try{
            const sends = await this.query.select("*").from("single_essays").where("user_id", userId);
            return sends;
        }catch(error: any){
            this.logger.error(error);
            throw { message: 'Erro ao consultar usuários no banco de dados', status: 500 };
        }
    }

    public async all() {
        try {
            const users = await this.query.select('*') as UserModel[];
            return Promise.all(users.map(async user => {
                return this.toEntity(user);
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
            const entity = await this.toEntity(recovered);
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
        return await this.toEntity(user);
    }

    public async *getUnsyncUsers() {
        let page = 1;
        paginating: while (true) {
            const query = this.query.whereNotIn('permission', [1, 5]);
            await this.paginate(query, { pageSize: 50, page, ordering: 'id' });
            const users = await query;
            if (users.length === 0) break paginating;
            yield users;
            page++;
        }
    }

    public async fixPermission(id: number) {
        return await this.query
            .where('user_id', id)
            .update({ permission: 6 });
    }

    public async countActives(filter: ChartFilter<UserInterface>) {
        try {
            const { period = {}, ...filterData } = filter;
            const {
                start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end = new Date(),
            } = period;
            const subquery = SubscriptionService(this.db)
                .where('expiration', '>', start)
                .where('registrationDate', '<', end)
                .select('user as user_id');
            const [{ count }] = await this.query.whereIn('user_id', subquery)
                .where(filterData)
                .count({ count: '*' });
            return Number(count || 0);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async countSentEssays(filter: ChartFilter<UserInterface>) {
        try {
            const { period = {}, ...filterData } = filter;
            const {
                start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end = new Date(),
            } = period;
            const subquery = EssayService(this.db)
                .where('sent_date', '>=', start)
                .where('sent_date', '<', end)
                .select('user_id');
            const [{ count }] = await this.query.whereIn('user_id', subquery)
                .where(filterData)
                .count({ count: '*' });
            return Number(count || 0);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async countEssaySentByUser(filter: ChartFilter<UserInterface>) {
        try {
            const { period = {}, ...filterData } = filter;
            const {
                start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end = new Date(),
            } = period;
            const sents = () => EssayService(this.db)
                .where('sent_date', '>=', start)
                .where('sent_date', '<', end);
            const query = this.query.whereIn('user_id', sents().select('user_id'));
            await this.filtering(query, { ...filterData });
            const subquery = sents().count('*')
                .whereRaw('`essays`.`user_id` = `users`.`user_id`')
                .as('sentEssays');
            const result = await query
                .select(
                    'users.*',
                    subquery,
                    this.db.raw('CONCAT(`users`.`first_name`, \' \', `users`.`last_name`) as fullName')
                );
            return result.map(val => ({ ...val }));
        } catch (error: any) {
            throw await this.processError(error);
        }
    }
}

