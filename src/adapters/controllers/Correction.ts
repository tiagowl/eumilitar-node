import CorrectionCase, { CorrectionData, CorrectionRepositoryInterface } from "../../cases/Correction";
import Controller from "./Controller";
import * as yup from 'yup';
import { Knex } from "knex";
import CorrectionRepository from "../models/Correction";
import Correction, { CorrectionInterface } from "../../entities/Correction";

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

export default class CorrectionController extends Controller<CorrectionData> {
    private repository: CorrectionRepositoryInterface;
    private useCase: CorrectionCase;

    constructor(driver: Knex) {
        super(schema, driver);
        this.repository = new CorrectionRepository(driver);
        this.useCase = new CorrectionCase(this.repository);
    }

    private async parseEntity(data: Correction): Promise<CorrectionInterface> {
        return {
            ...data,
            id: data.id,
            essay: data.essay,
            correctionDate: data.correctionDate,
        };
    }

    public async create(data: CorrectionData) {
        try {
            const validated = await this.validate(data);
            const created = await this.useCase.create(validated);
            return this.parseEntity(created);
        } catch (error) {
            if (error.status) throw error;
            throw { message: error.message || "Falha ao salvar correção", status: 400 };
        }
    }

    public async get(filter: Partial<CorrectionInterface>) {
        try {
            const data = await this.useCase.get(filter);
            return this.parseEntity(data);
        } catch (error) {
            if (error.status) throw error;
            throw { message: error.message || "Falha ao encontrar correção", status: 500 };
        }
    }
}