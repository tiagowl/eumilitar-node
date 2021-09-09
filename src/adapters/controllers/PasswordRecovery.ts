import Controller from "./Controller";
import { Mail, MessageConfigInterface } from '../interfaces';
import { Knex } from "knex";
import * as yup from 'yup';
import UserRepository from "../models/User";
import crypto from 'crypto';
import { PasswordRecoveryInsert, PasswordRecoveryModel, PasswordRecoveryService } from '../models/PasswordRecoveries';
import PasswordRecoveryRender from '../views/PasswordRecovery';
import { Context } from "../interfaces";

export interface PasswordRecoveryInterface {
    email: string;
}

export type PasswordRecoveryResponse = {
    message: string
};

export default class PasswordRecoveryController extends Controller<PasswordRecoveryInterface> {
    private readonly smtp: Mail;
    private readonly repository: UserRepository;
    private readonly config: MessageConfigInterface;
    private readonly service: Knex.QueryBuilder<PasswordRecoveryInsert, PasswordRecoveryModel>;

    constructor(context: Context) {
        const { smtp, driver, settings } = context;
        const schema = yup.object().shape({
            email: yup.string().email('Email inválido').required('O campo "email" é obrigatório'),
        });
        super(context, schema);
        this.smtp = smtp;
        this.repository = new UserRepository(context);
        this.config = settings.messageConfig;
        this.service = PasswordRecoveryService(driver);
    }

    private async generateConfirmationToken(): Promise<string> {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(32, (error, buffer) => {
                if (error) reject(error);
                else resolve(buffer.toString('hex'));
            });
        });
    }

    private async writeMessage(username: string, link: string) {
        const { expirationTime } = this.config;
        return `
            Olá, ${username}!\n
            Aqui está o link para você cadastrar sua nova senha. Acesse no link abaixo para prosseguir.
            Ele será válido por apenas ${expirationTime} hora${expirationTime >= 1 && "s"}.\n
            ${link} \n
            Caso você não tenha feito esta solicitação, basta ignorar este e-mail.\n
            Atenciosamente,
            Equipe de Suporte Eu Militar\n
        `;
    }

    private async renderMessage(username: string, link: string) {
        return PasswordRecoveryRender({
            link, username,
            expirationTime: this.config.expirationTime
        });
    }

    private async sendConfirmationEmail(email: string, username: string, token: string) {
        const link = `${this.config.url}${token}`;
        return this.smtp.sendMail({
            from: this.config.sender,
            to: { email, name: username },
            subject: 'Recuperação de senha',
            text: await this.writeMessage(username, link),
            html: await this.renderMessage(username, link),
        });
    }

    private async saveToken(userId: number, token: string) {
        if (token) {
            return this.service.insert({
                token,
                expires: new Date(Date.now() + this.config.expirationTime * 60 * 60 * 1000),
                selector: crypto.randomBytes(24).toString('hex').substring(0, 16),
                user_id: userId,
            });
        }
        throw { message: "Token inválido" };
    }

    public async recover(rawData: PasswordRecoveryInterface,): Promise<PasswordRecoveryResponse> {
        try {
            const data = await this.validate(rawData);
            const user = await this.repository.get(data);
            if (!user) throw { message: 'Usuário não encontrado', status: 404 };
            const token = await this.generateConfirmationToken();
            await this.saveToken(user.id, token);
            return this.sendConfirmationEmail(user.email, user.fullName, token)
                .then(async () => ({ message: "Email enviado! Verifique sua caixa de entrada." }))
                .catch(async (error) => {
                    this.logger.error(error);
                    throw { message: 'Falha ao enviar o email! Tente novamente ou entre em contato com o suporte.' };
                });
        } catch (error: any) {
            this.logger.error({ ...error });
            throw error;
        }
    }

}

