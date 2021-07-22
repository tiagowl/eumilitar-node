import { Knex } from "knex";
import Controller from "./Controller";
import * as yup from 'yup';
import { PasswordRecoveryInsert, PasswordRecoveryModel, PasswordRecoveryService } from '../models/PasswordRecoveries';
import { Logger } from 'winston';
import { Context } from "../interfaces";

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

    constructor(context: Context) {
        const { driver } = context;
        super(context, schema);
        this.service = PasswordRecoveryService(driver);
    }

    get tokenData() { return this._tokenData; }

    private async getTokenInfo(token: string) {
        return await this.service.where('token', token).first();
    }

    private async deleteToken(token: string) {
        const service = PasswordRecoveryService(this.driver);
        return await service.where('token', token).del();
    }

    public async check(data: CheckPasswordInterface,): Promise<CheckedTokenInterface> {
        try {
            const validated = await this.isValid(data);
            const info = await this.getTokenInfo(data.token);
            const expired = new Date(info?.expires || 0) <= new Date();
            const isValid = validated && !expired && !!info;
            if (isValid) this._tokenData = info;
            else this.deleteToken(data.token);
            return { isValid };
        } catch (error) {
            this.logger.error(error);
            throw { isValid: false };
        }
    }

}