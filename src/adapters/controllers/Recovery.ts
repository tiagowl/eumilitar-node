import Controller from "./Controller";
import { Mail, MessageConfigInterface } from '../interfaces';
import * as yup from 'yup';
import RecoveryRepository from '../models/Recovery';
import RecoveryRender from '../views/Recovery';
import { Context } from "../interfaces";
import RecoveryCase, { CheckShortTokenData, UpdatePasswordData as DefaultUpdatePasswordData } from "../../cases/Recovery";
import CaseError, { Errors } from "../../cases/Error";
import User from "../../entities/User";
import Recovery from "../../entities/Recovery";

interface RecoveryData {
    email: string;
    session: string;
}

export interface RecoveryInterface extends RecoveryData {
    type: 'email' | 'sms';
}

export type RecoveryResponse = {
    message: string
};

export interface CheckInterface {
    token: string;
}

export interface UpdatePasswordData extends DefaultUpdatePasswordData {
    confirmPassword: string;
}

const schema = yup.object().shape({
    email: yup.string().email('Email inválido').required('O campo "email" é obrigatório'),
    type: yup.string().required('É preciso especificar o tipo de recuperação')
        .is(['email', 'sms'], 'Tipo de recuperação inválido'),
    session: yup.string().uuid('Código de sessão inválido')
        .required('O código da sessão é obrigatório'),
});

const checkSchema = yup.object().shape({
    token: yup.string().required('O token é obrigatório')
        .length(64, 'Token inválido')
});

const checkShortTokenSchema = yup.object().shape({
    token: yup.string().required('O token é obrigatório')
        .length(6, 'Token inválido').matches(/^\d{6}$/g, 'Token inválido'),
    session: yup.string().uuid('Código de sessão inválido')
        .required('O código da sessão é obrigatório'),
});

const updatePasswordSchema = yup.object().shape({
    password: yup.string()
        .required('É preciso criar uma senha nova')
        .min(8, "A senha deve conter pelo menos 8 caracteres")
        .max(16, "A senha deve conter no máximo 16 caracteres"),
    confirmPassword: yup.string()
        .required('É preciso confirmar sua senha')
        .oneOf([yup.ref('password')], "As senhas não coincidem"),
    token: yup.string()
        .required('O token é obrigatório')
        .length(64, 'Token inválido')
});

export default class RecoveryController extends Controller<RecoveryInterface> {
    private readonly smtp: Mail;
    private readonly repository: RecoveryRepository;
    private readonly config: MessageConfigInterface;
    private readonly useCase: RecoveryCase;

    constructor(context: Context) {
        const { smtp, settings } = context;
        super(context, schema);
        this.smtp = smtp;
        this.repository = new RecoveryRepository(context);
        this.config = settings.messageConfig;
        this.useCase = new RecoveryCase(this.repository, this.config.expirationTime * 60 * 60 * 1000);
    }

    private async writeEmail(username: string, link: string) {
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

    private async renderEmail(username: string, link: string) {
        return RecoveryRender({
            link, username,
            expirationTime: this.config.expirationTime
        });
    }

    private async sendRecoveryEmail(email: string, username: string, token: string) {
        try {
            const link = `${this.config.url}${token}`;
            await this.smtp.sendMail({
                from: this.config.sender,
                to: { email, name: username },
                subject: 'Recuperação de senha',
                text: await this.writeEmail(username, link),
                html: await this.renderEmail(username, link),
            });
        } catch (error: any) {
            this.logger.error(error);
            throw { message: 'Falha ao enviar o email! Tente novamente ou entre em contato com o suporte.', status: 500 };
        }
    }

    private async recoveryByEmail(data: RecoveryData) {
        const { recovery, user } = await this.useCase.create(data);
        await this.sendRecoveryEmail(user.email, user.fullName, recovery.token);
        return { message: "Email enviado! Verifique sua caixa de entrada." };
    }

    private async writeSMS(recovery: Recovery) {
        return `Seu código Eu Militar: ${recovery.token}. Não compartilhe este código com ninguém!`;
    }

    private async sendRecoverySMS(user: User, recovery: Recovery) {
        try {
            const message = await this.writeSMS(recovery);
            await this.context.sms.send(user.phone || '', message);
        } catch (error: any) {
            this.logger.error(error);
            throw { message: 'Falha ao enviar o SMS! Tente novamente ou entre em contato com o suporte.', status: 500 };
        }
    }

    private async recoveryBySMS(data: RecoveryData) {
        const { recovery, user } = await this.useCase.create({ ...data, long: false });
        await this.sendRecoverySMS(user, recovery);
        const phone = user.phone?.replace(/(?!\d{7})(\d{4})/g, 'xxxx');
        return { message: `SMS enviado para +${phone?.slice(0, 2)} (${phone?.slice(2, 4)}) ${phone?.slice(4, 5)} ${phone?.slice(5, 9)}-${phone?.slice(9, 13)}, verifique sua caixa de mensagens` };
    }

    public async recover(rawData: RecoveryInterface): Promise<RecoveryResponse> {
        try {
            const { type, ...data } = await this.validate(rawData);
            const types = {
                sms: async (val: RecoveryData) => this.recoveryBySMS(val),
                email: async (val: RecoveryData) => this.recoveryByEmail(val),
            };
            return await types[type](data);
        } catch (error: any) {
            if (error instanceof CaseError) {
                throw { message: error.message, status: 400 };
            }
            this.logger.error({ ...error });
            if (error.status) throw error;
            throw { message: error.message };
        }
    }

    public async check(data: CheckInterface) {
        try {
            const { token } = await this.validate(data, checkSchema);
            const recovery = await this.useCase.checkLongToken(token);
            return { isValid: !!recovery };
        } catch (error: any) {
            this.logger.error(error);
            return { isValid: false };
        }
    }

    public async updatePassword(data: UpdatePasswordData) {
        try {
            const validated = await this.validate(data, updatePasswordSchema);
            const updated = await this.useCase.updatePassword(validated);
            return { updated };
        } catch (error: any) {
            this.logger.error(error);
            if (error instanceof CaseError) {
                throw { message: error.message, status: 400 };
            }
            if (error.status) throw error;
            throw { message: 'Erro atualizar senha', status: 500 };
        }
    }

    public async checkShortToken(data: CheckShortTokenData) {
        try {
            const validated = await this.validate(data, checkShortTokenSchema);
            const token = await this.useCase.checkShortToken(validated);
            return { token: token.token };
        } catch (error: any) {
            this.logger.error(error);
            if (error instanceof CaseError) {
                throw { message: error.message, status: 400 };
            }
            if (error.status) throw error;
            throw { message: 'Erro atualizar senha', status: 500 };
        }
    }

}

