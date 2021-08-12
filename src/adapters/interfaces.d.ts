import { AxiosInstance } from "axios";
import { Knex } from "knex";
import { Multer } from "multer";
import winston from "winston";

export interface MailData {
    from: {
        email: string;
        name: string;
    };
    to: {
        email: string;
        name: string;
    };
    subject: string;
    text: string;
    html?: string;
}

export interface Mail {
    sendMail(data: MailData): Promise<any>;
}

export interface Settings {
    readonly messageConfig: MessageConfigInterface;
    readonly hotmart: {
        readonly hottok: string;
        readonly token: string;
        readonly id: string;
        readonly secret: string;
        readonly env: 'developers' | 'sandbox';
    };
}

export type Context = {
    readonly driver: Knex;
    readonly smtp: Mail;
    readonly storage: Multer;
    readonly settings: Settings;
    readonly logger: winston.Logger;
    readonly http: AxiosInstance;
};


export interface MessageConfigInterface {
    readonly sender: {
        readonly email: string;
        readonly name: string;
    };
    readonly url: string;
    readonly expirationTime: number;
    readonly adminMail: string;
}
