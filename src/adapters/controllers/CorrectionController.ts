import CorrectionCase, { CorrectionBase, CorrectionData, CorrectionRepositoryInterface } from "../../cases/CorrectionCase";
import Controller from "./Controller";
import * as yup from 'yup';
import CorrectionRepository from "../models/CorrectionRepository";
import Correction, { CorrectionInterface } from "../../entities/Correction";
import { Mail, MessageConfigInterface } from "../interfaces";
import message from '../views/CorrectionNotification';
import { Context } from '../interfaces';
import CaseError, { Errors } from "../../cases/ErrorCase";

const schema = yup.object().shape({
    essay: yup.number().required('É preciso informar qual redação será corrigida'),
    corrector: yup.number().required("É preciso informar qual é o professor"),
    isReadable: yup.string().required('É preciso informar se está legível').max(25, 'Máximo de 25 digitos'),
    hasMarginSpacing: yup.string().required('Avalie o espaçamento da margem').max(25, 'Máximo de 25 digitos'),
    obeyedMargins: yup.string().required('Avalie as margens').max(25, 'Máximo de 25 digitos'),
    erased: yup.string().required('Houve alguma rasura?').max(25, 'Máximo de 25 digitos'),
    orthography: yup.string().required('Avalie a ortografia').max(25, 'Máximo de 25 digitos'),
    accentuation: yup.string().required('Avalie a acentuação').max(25, 'Máximo de 25 digitos'),
    agreement: yup.string().required('Avalie a concordância').max(25, 'Máximo de 25 digitos'),
    repeated: yup.string().required('Avalie a repetição de palavras').max(25, 'Máximo de 25 digitos'),
    veryShortSentences: yup.string().required('Avalie o tamanho das sentenças').max(25, 'Máximo de 25 digitos'),
    understoodTheme: yup.string().required('Avalie o entendimento sobre o tema').max(25, 'Máximo de 25 digitos'),
    followedGenre: yup.string().required('Avalie se seguiu o gênero').max(25, 'Máximo de 25 digitos'),
    cohesion: yup.string().required('Avalie a coesão').max(25, 'Máximo de 25 digitos'),
    organized: yup.string().required('Avalie a organização do texto').max(25, 'Máximo de 25 digitos'),
    conclusion: yup.string().required('Avalie a conclusão do texto').max(25, 'Máximo de 25 digitos'),
    comment: yup.string().required('Avalie sob aspécto geral'),
    points: yup.number().required('Informe a pontuação do aluno')
        .min(0, 'A nota não pode ser menor que 0')
        .max(10, "A nota não pode ser maior que 10"),
});

const updateSchema = yup.object().shape({
    isReadable: yup.string().max(25, 'Máximo de 25 digitos'),
    hasMarginSpacing: yup.string().max(25, 'Máximo de 25 digitos'),
    obeyedMargins: yup.string().max(25, 'Máximo de 25 digitos'),
    erased: yup.string().max(25, 'Máximo de 25 digitos'),
    orthography: yup.string().max(25, 'Máximo de 25 digitos'),
    accentuation: yup.string().max(25, 'Máximo de 25 digitos'),
    agreement: yup.string().max(25, 'Máximo de 25 digitos'),
    repeated: yup.string().max(25, 'Máximo de 25 digitos'),
    veryShortSentences: yup.string().max(25, 'Máximo de 25 digitos'),
    understoodTheme: yup.string().max(25, 'Máximo de 25 digitos'),
    followedGenre: yup.string().max(25, 'Máximo de 25 digitos'),
    cohesion: yup.string().max(25, 'Máximo de 25 digitos'),
    organized: yup.string().max(25, 'Máximo de 25 digitos'),
    conclusion: yup.string().max(25, 'Máximo de 25 digitos'),
    comment: yup.string(),
    points: yup.number().min(0, 'A nota não pode ser menor que 0')
        .max(10, "A nota não pode ser maior que 10"),
});

export default class CorrectionController extends Controller {
    private readonly repository: CorrectionRepositoryInterface;
    private readonly useCase: CorrectionCase;
    private readonly smtp: Mail;
    private readonly config: MessageConfigInterface;

    constructor(context: Context) {
        const { smtp, settings } = context;
        super(context);
        this.repository = new CorrectionRepository(context);
        this.useCase = new CorrectionCase(this.repository);
        this.smtp = smtp;
        this.config = settings.messageConfig;
    }

    private async parseEntity(data: Correction): Promise<CorrectionInterface> {
        return {
            ...data,
            id: data.id,
            essay: data.essay,
            correctionDate: data.correctionDate,
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
            const user = await this.repository.users.get({ id: essay?.student });
            if (!user) return;
            return this.smtp.sendMail({
                from: this.config.sender,
                to: { email: user.email, name: user.firstName },
                subject: 'Redação Corrigida',
                text: await this.writeNotification(user.firstName),
                html: await this.renderNotification(user.firstName),
            });
        } catch (error: any) {
            this.logger.error(error);
        }
    }

    public async create(data: CorrectionData) {
        try {
            const validated = await this.validate(data, schema);
            const created = await this.useCase.create(validated);
            this.notify(created.essay).catch(this.logger.error);
            return await this.parseEntity(created);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message || "Falha ao salvar correção", status: 400 };
        }
    }

    public async get(filter: Partial<CorrectionInterface>) {
        try {
            const data = await this.useCase.get(filter);
            return await this.parseEntity(data);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message || "Falha ao encontrar correção", status: 500 };
        }
    }

    public async update(essayId: number, user: number, data: Partial<CorrectionBase>) {
        try {
            const validated = await this.validate(data, updateSchema);
            const casted = await this.castFilter(validated, updateSchema);
            const updated = await this.useCase.update(essayId, user, casted);
            return await this.parseEntity(updated);
        } catch (error: any) {
            this.logger.error(error);
            if (error instanceof CaseError) {
                if (error.code === Errors.NOT_FOUND) throw { message: error.message, status: 404 };
                if (error.code === Errors.UNAUTHORIZED) throw { message: error.message, status: 401 };
            }
            if (error.status) throw error;
            throw { message: error.message || "Falha ao atualizar correção", status: 500 };
        }
    }
}