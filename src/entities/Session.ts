export interface SessionInterface {
    id: number;
    token: string;
    loginTime: Date;
    user: number;
    agent?: string;
}

export default class Session implements SessionInterface {
    readonly id: number;
    token: string;
    loginTime: Date;
    user: number;
    agent?: string;

    constructor(data: SessionInterface) {
        this.id = data.id;
        this.token = data.token;
        this.loginTime = data.loginTime;
        this.user = data.user;
        this.agent = data.agent;
    }
}