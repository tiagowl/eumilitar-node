import Controller from "./Controller";
import { Transporter } from 'nodemailer';
import { Knex } from "knex";
import * as yup from 'yup';
import UserRepository from "../models/User";
import crypto from 'crypto';
import { PasswordRecoveryInsert, PasswordRecoveryModel, PasswordRecoveryService } from '../models/PasswordRecoveries';
import PasswordRecoveryRender from '../views/PasswordRecovery';
export interface PasswordRecoveryInterface {
    email: string;
}

export interface MessageConfigInterface {
    sender: string;
    url: string;
}

export const schema = yup.object().shape({
    email: yup.string().email('Email inválido').required('O campo "email" é obrigatório'),
})

export type PasswordRecoveryResponse = {
    message: string
}

export default class PasswordRecoveryController extends Controller<PasswordRecoveryInterface> {
    private smtp: Transporter;
    private repository: UserRepository;
    private config: MessageConfigInterface;
    private token?: string;
    private service: Knex.QueryBuilder<PasswordRecoveryInsert, PasswordRecoveryModel>;

    constructor(data: PasswordRecoveryInterface, driver: Knex, smtp: Transporter, config: MessageConfigInterface) {
        super(data, schema, driver);
        this.smtp = smtp;
        this.repository = new UserRepository(driver);
        this.config = config;
        this.service = PasswordRecoveryService(driver);
    }

    private async generateConfirmationToken() {
        return crypto.randomBytes(64).toString('base64').substring(0, 64);
    }

    private async writeMessage(username: string) {
        const link = `${this.config.url}${this.token}`;
        return `
            Olá, ${username}!\n
            Aqui está o link para você cadastrar sua nova senha. Acesse no link abaixo para prosseguir.
            ${link} \n
            Caso você não tenha feito esta solicitação, basta ignorar este e-mail.\n
            Atenciosamente,
            Equipe de Suporte Eu Militar
        `
    }

    private async renderMessage(username: string) {
        const link = `${this.config.url}${this.token}`;
        return PasswordRecoveryRender({ link, username })
    }

    private async sendConfirmationEmail(email: string, username: string) {
        return this.smtp.sendMail({
            from: this.config.sender,
            to: email,
            subject: 'Recuperação de senha',
            text: await this.writeMessage(username),
            html: await this.renderMessage(username),
        })
    }

    private async saveToken(userId: number) {
        if (this.token) {
            const token: PasswordRecoveryInsert = {
                token: this.token,
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                selector: crypto.randomBytes(24).toString('hex').substring(0, 16),
                user_id: userId,
            }
            return this.service.insert(token);
        }
        throw { message: "Token inválido" }
    }

    public async recover(): Promise<PasswordRecoveryResponse> {
        const { data, error } = await this.validate();
        if (data) {
            try {
                const user = await this.repository.get(data);
                this.token = await this.generateConfirmationToken();
                await this.saveToken(user.id);
                return this.sendConfirmationEmail(user.email, user.fullName)
                    .then(async () => ({ message: "Email enviado! Verifique sua caixa de entrada." }))
                    .catch(async () => {
                        throw { message: 'Falha ao enviar o email! Tente novamente ou entre em contato com o suporte.' }
                    });
            } catch {
                throw { message: 'Usuário não encontrado' }
            }
        } else {
            throw { message: error?.message || "Email inválido" }
        }
    }

}