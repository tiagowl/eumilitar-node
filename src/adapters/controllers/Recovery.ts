import Controller from "./Controller";
import { Mail, MessageConfigInterface } from '../interfaces';
import * as yup from 'yup';
import RecoveryRepository from '../models/Recovery';
import RecoveryRender from '../views/Recovery';
import { Context } from "../interfaces";
import RecoveryCase, { UpdatePasswordData as DefaultUpdatePasswordData } from "../../cases/Recovery";
import CaseError, { Errors } from "../../cases/Error";

export interface RecoveryInterface {
    email: string;
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
});

const checkSchema = yup.object().shape({
    token: yup.string().required('O token é obrigatório'),
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
        return RecoveryRender({
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

    public async recover(rawData: RecoveryInterface,): Promise<RecoveryResponse> {
        try {
            const { email } = await this.validate(rawData);
            const { recovery, user } = await this.useCase.create(email);
            await this.sendConfirmationEmail(user.email, user.fullName, recovery.token)
                .catch(async (error) => {
                    this.logger.error(error);
                    throw { message: 'Falha ao enviar o email! Tente novamente ou entre em contato com o suporte.', status: 500 };
                });
            return { message: "Email enviado! Verifique sua caixa de entrada." };
        } catch (error: any) {
            if (error instanceof CaseError) {
                if (error.code === Errors.NOT_FOUND) throw { message: error.message, status: 400 };
            }
            this.logger.error({ ...error });
            throw error;
        }
    }

    public async check(data: CheckInterface) {
        try {
            const { token } = await this.validate(data, checkSchema);
            const recovery = await this.useCase.check(token);
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
            if (error instanceof CaseError) {
                throw { message: error.message, status: 400 };
            }
            if (error.status) throw error;
            throw { message: 'Erro atualizar senha', status: 500 };
        }
    }

}

