export interface LogInterface {
    readonly id: number;
    user?: number;
    registrationDate: Date;
    event: string;
    userAgent: string;
    ip: string;
}

export default class Log implements LogInterface {
    public readonly id: number;
    public user?: number;
    public registrationDate: Date;
    public event: string;
    public userAgent: string;
    public ip: string;

    constructor(data: LogInterface) {
        this.id = data.id;
        this.user = data.user;
        this.registrationDate = data.registrationDate;
        this.event = data.event;
        this.userAgent = data.userAgent;
        this.ip = data.ip;
    }
}