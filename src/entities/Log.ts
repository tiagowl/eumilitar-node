export type EventType = 'login' | 'sent-essay' | 'theme-preview' | 'correction-preview' | 'single-link-sent';

export const eventTypes = new Set<EventType>(['login', 'sent-essay', 'theme-preview', 'correction-preview', 'single-link-sent']);

export interface LogInterface {
    readonly id: number;
    user?: number;
    registrationDate: Date;
    event: EventType;
    userAgent?: string;
    ip: string;
    error?: string;
    details?: string;
}

export default class Log implements LogInterface {
    public readonly id: number;
    public user?: number;
    public registrationDate: Date;
    public event: EventType;
    public userAgent?: string;
    public ip: string;
    public error?: string;
    public details?: string;

    constructor(data: LogInterface) {
        this.id = data.id;
        this.user = data.user;
        this.registrationDate = data.registrationDate;
        this.event = data.event;
        this.userAgent = data.userAgent;
        this.ip = data.ip;
        this.error = data.error;
        this.details = data.details;
    }
}