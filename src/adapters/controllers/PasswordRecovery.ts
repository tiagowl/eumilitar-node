import Controller from "./Controller";
import { Mail, MessageConfigInterface } from '../interfaces';
import { Knex } from "knex";
import * as yup from 'yup';
import UserRepository from "../models/User";
import crypto from 'crypto';
import { PasswordRecoveryInsert, PasswordRecoveryModel, PasswordRecoveryService } from '../models/PasswordRecoveries';
import PasswordRecoveryRender from '../views/PasswordRecovery';
import { Logger } from 'winston';
import { Context } from "../interfaces";

export interface PasswordRecoveryInterface {
    email: string;
}


export type PasswordRecoveryResponse = {
    message: string
};

export default class PasswordRecoveryController extends Controller<PasswordRecoveryInterface> {
    private smtp: Mail;
    private repository: UserRepository;
    private config: MessageConfigInterface;
    private token?: string;
    private service: Knex.QueryBuilder<PasswordRecoveryInsert, PasswordRecoveryModel>;

    constructor(context: Context) {
        const { smtp, driver, logger, settings } = context;
        const schema = yup.object().shape({
            email: yup.string().email('Email inválido').required('O campo "email" é obrigatório'),
        });
        super(context, schema);
        this.smtp = smtp;
        this.repository = new UserRepository(driver, logger);
        this.config = settings.messageConfig;
        this.service = PasswordRecoveryService(driver);
    }

    private async generateConfirmationToken() {
        return crypto.randomBytes(64).toString('base64').substring(0, 64);
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
        return await PasswordRecoveryRender({
            link, username,
            expirationTime: this.config.expirationTime
        });
    }

    private async sendConfirmationEmail(email: string, username: string) {
        const token = encodeURIComponent(this.token || "");
        const link = `${this.config.url}${token}`;
        return this.smtp.sendMail({
            from: this.config.sender,
            to: { email, name: username },
            subject: 'Recuperação de senha',
            text: await this.writeMessage(username, link),
            html: await this.renderMessage(username, link),
        });
    }

    private async saveToken(userId: number) {
        if (this.token) {
            const token: PasswordRecoveryInsert = {
                token: this.token,
                expires: new Date(Date.now() + this.config.expirationTime * 60 * 60 * 1000),
                selector: crypto.randomBytes(24).toString('hex').substring(0, 16),
                user_id: userId,
            };
            return this.service.insert(token);
        }
        throw { message: "Token inválido" };
    }

    public async recover(rawData: PasswordRecoveryInterface,): Promise<PasswordRecoveryResponse> {
        try {
            const data = await this.validate(rawData);
            const user = await this.repository.get(data);
            this.token = await this.generateConfirmationToken();
            await this.saveToken(user.id);
            return this.sendConfirmationEmail(user.email, user.fullName)
                .then(async () => ({ message: "Email enviado! Verifique sua caixa de entrada." }))
                .catch(async (error) => {
                    this.logger.error(error);
                    throw { message: 'Falha ao enviar o email! Tente novamente ou entre em contato com o suporte.' };
                });
        } catch (error) {
            this.logger.error({ ...error });
            throw error;
        }
    }

}

