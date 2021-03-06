export type EventType = 'login' | 'sent-essay' | 'theme-preview' | 'correction-preview' | 'single-link-sent' | 'user-creation' | 'user-updating' | 'extra-correction';

export const eventTypes = new Set<EventType>(['login', 'sent-essay', 'theme-preview', 'correction-preview', 'single-link-sent', 'user-creation', 'user-updating', 'extra-correction']);

export interface LogInterface {
    readonly id: number;
    user?: number;
    registrationDate: Date;
    event: EventType;
    userAgent?: string;
    ip?: string;
    error?: string;
    details?: string;
}

export default class Log implements LogInterface {
    readonly id: number;
    user?: number;
    registrationDate: Date;
    event: EventType;
    userAgent?: string;
    ip?: string;
    error?: string;
    details?: string;

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