import { AxiosInstance } from "axios";
import { Knex } from "knex";
import { Multer } from "multer";
import winston from "winston";

export interface MailData {
    readonly from: {
        readonly email: string;
        readonly name: string;
    };
    readonly to: {
        readonly email: string;
        readonly name: string;
    };
    readonly subject: string;
    readonly text: string;
    readonly html?: string;
}

export interface Mail {
    readonly sendMail: (data: MailData) => Promise<any>;
}

export interface Settings {
    readonly messageConfig: MessageConfigInterface;
    readonly singleEssayExpiration: number;
    readonly hotmart: {
        readonly hottok: string;
        readonly token: string;
        readonly id: string;
        readonly secret: string;
        readonly env: 'developers' | 'sandbox';
    };
}

export type Context = {
    readonly db: Knex;
    readonly smtp: Mail;
    readonly storage: Multer;
    readonly settings: Settings;
    readonly logger: winston.Logger;
    readonly http: AxiosInstance;
    readonly sms: SMS;
};


export interface MessageConfigInterface {
    readonly sender: {
        readonly email: string;
        readonly name: string;
    };
    readonly url: string;
    readonly expirationTime: number;
    readonly supportMail: string;
    readonly adminMail: string;
}

export interface SMS {
    readonly send: (to: string, msg: string) => Promise<void>;
}