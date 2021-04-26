import Controller from "./Controller";
import { Transporter } from 'nodemailer';
import { Knex } from "knex";
import * as yup from 'yup';
import UserRepository from "../models/User";
import crypto from 'crypto';
import { PasswordRecoveryInsert, PasswordRecoveryModel, PasswordRecoveryService } from '../models/PasswordRecoveries';

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

    private async writeMessage() {
        return `
            Acesse o link para criar uma nova senha de senha 
            ${this.config.url}${this.token}
        `
    }

    private async renderMessage() {
        const link = `${this.config.url}${this.token}`;
        return `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml">
                <head>
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    <title>Recuperação de senha</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                </head>
                <body style="margin: 0; padding: 0;">
                    <table border="0" cellpadding="1" cellspacing="1" width="100%">
                        <tr>
                            <td>Clique no link para criar uma nova senha</td>
                        </tr>
                        <tr>
                            <td>
                                <a href="${link}">${link}</a>
                            </td>
                        </tr>
                    </table>
                </body>
            </html>
        `
    }

    private async sendConfirmationEmail(email: string) {
        return this.smtp.sendMail({
            from: this.config.sender,
            to: email,
            subject: 'Recuperação de senha',
            text: await this.writeMessage(),
            html: await this.renderMessage(),
        })
    }

    private async saveToken(user_id: number) {
        if (this.token) {
            const token: PasswordRecoveryInsert = {
                token: this.token,
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                selector: crypto.randomBytes(24).toString('hex').substring(0, 16),
                user_id,
            }
            return this.service.insert(token)
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
                return this.sendConfirmationEmail(user.email)
                    .then(async () => ({ message: "Email enviado! Verifique sua caixa de entrada." }))
                    .catch(async () => {
                        throw { message: 'Falha ao enviar o email! Tente novamente' }
                    });
            } catch {
                throw { message: 'Usuário não encontrado' }
            }
        } else {
            throw { message: error?.message || "Email inválido" }
        }
    }

}