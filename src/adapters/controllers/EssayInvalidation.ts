import EssayInvalidation, { EssayInvalidationInterface, Reason, reasons } from "../../entities/EssayInvalidation";
import Controller from "./Controller";
import * as yup from 'yup';
import { Knex } from "knex";
import EssayInvalidationCase, { EssayInvalidationCreationData, EssayInvalidationRepositoryInterface } from "../../cases/EssayInvalidation";
import EssayInvalidationRepository from "../models/EssayInvalidation";
import message from '../views/CorrectionNotification';
import { Mail, MessageConfigInterface } from '../interfaces';
import UserRepository from "../models/User";
import { Logger } from 'winston';
import { Context } from "../interfaces";

const schema = yup.object().shape({
    corrector: yup.number().required("É preciso informar o corretor!"),
    essay: yup.number().required('É preciso informar a redação'),
    reason: yup.string().oneOf(reasons, "Motivo inválido").required('É preciso informar o motivo'),
    comment: yup.string().when('reason', {
        is: (val: Reason) => val === 'other',
        then: yup.string().required('É preciso descrever o motivo'),
        otherwise: yup.string(),
    }),
});

export default class EssayInvalidationController extends Controller<EssayInvalidationCreationData> {
    private useCase: EssayInvalidationCase;
    private repository: EssayInvalidationRepositoryInterface;
    private smtp: Mail;
    private config: MessageConfigInterface;

    constructor(context: Context) {
        const { smtp, settings } = context;
        super(context, schema);
        this.repository = new EssayInvalidationRepository(context);
        this.useCase = new EssayInvalidationCase(this.repository);
        this.smtp = smtp;
        this.config = settings.messageConfig;
    }

    private async parseEntity(entity: EssayInvalidation): Promise<EssayInvalidationInterface> {
        return {
            id: entity.id,
            essay: entity.essay,
            corrector: entity.corrector,
            reason: entity.reason,
            invalidationDate: entity.invalidationDate,
            comment: entity.comment,
        };
    }


    private async writeNotification(username: string) {
        return `Olá, ${username}!\n
        A correção da sua redação já está disponível dentro da plataforma.\n
        Vá na página inicial da plataforma e clique em Ver redações\n
        Em caso de dúvida, entre em contato com nossa equipe de suporte.\n
        Atenciosamente,\n
        Equipe de Suporte Eu Militar`;
    }

    private async renderNotification(username: string) {
        return message({ username });
    }

    private async notify(essayId: number) {
        try {
            const essay = await this.repository.essays.get({ id: essayId });
            const users = new UserRepository(this.context);
            const user = await users.get({ id: essay?.student });
            if(!user) throw new Error(`Usuário "${essay?.student}", da redação "${essay?.id}" não encontrado`);
            return this.smtp.sendMail({
                from: this.config.sender,
                to: { email: user.email, name: user.firstName },
                subject: 'Redação Corrigida',
                text: await this.writeNotification(user.firstName),
                html: await this.renderNotification(user.firstName),
            });
        } catch (error) {
            this.logger.error(error);
        }
    }


    public async create(data: EssayInvalidationCreationData) {
        try {
            const validated = await this.validate(data);
            const created = await this.useCase.create(validated);
            this.notify(created.essay);
            return this.parseEntity(created);
        } catch (error) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message || 'Falha ao invalidar redação', status: 400 };
        }
    }

    public async get(essayId: number) {
        try {
            const invalidation = await this.useCase.get(essayId);
            return this.parseEntity(invalidation);
        } catch (error) {
            this.logger.error(error);
            throw { message: error.message || 'Falha ao invalidar redação', status: 500 };
        }
    }
}