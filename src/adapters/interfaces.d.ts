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
    html: string;
}

export interface Mail {
    sendMail(data: MailData): Promise<any>;
}

export interface Settings {
    messageConfig: MessageConfigInterface;
    hotmart: {
        hottok: string;
        token: string;
        id: string;
        secret: string;
        env: 'developers' | 'sandbox';
    };
}

export type Context = {
    driver: Knex;
    smtp: Mail;
    storage: Multer;
    settings: Settings;
    logger: winston.Logger;
    http: AxiosInstance;
};


export interface MessageConfigInterface {
    sender: {
        email: string;
        name: string;
    };
    url: string;
    expirationTime: number;
}
