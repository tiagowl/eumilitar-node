import { Knex } from "knex";
import Controller from "./Controller";
import * as yup from 'yup';
import { PasswordRecoveryInsert, PasswordRecoveryModel, PasswordRecoveryService } from '../models/PasswordRecoveries';

export interface CheckPasswordInterface {
    token: string;
}
export interface CheckedTokenInterface {
    isValid: boolean;
}

export const schema = yup.object({
    token: yup.string().required('O token é obrigatório').length(64, "Token inválido")
});

export default class CheckPasswordToken extends Controller<CheckPasswordInterface> {
    private service: Knex.QueryBuilder<PasswordRecoveryInsert, PasswordRecoveryModel>;
    private _tokenData?: PasswordRecoveryModel;

    constructor(data: CheckPasswordInterface, driver: Knex) {
        super(data, schema, driver);
        this.service = PasswordRecoveryService(driver);
    }

    get tokenData() { return this._tokenData }

    private async getTokenInfo(token: string) {
        return await this.service.where('token', token).first();
    }

    public async check(): Promise<CheckedTokenInterface> {
        try {
            const validated = await this.isValid();
            const info = await this.getTokenInfo(this.data.token);
            const expired = new Date(info?.expires || 0) <= new Date();
            const isValid = validated && !expired && !!info;
            if (isValid) this._tokenData = info;
            return { isValid };
        } catch {
            throw { isValid: false }
        }
    }

}