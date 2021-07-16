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