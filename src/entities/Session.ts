export interface SessionInterface {
    id: string;
    loginTime: Date;
    user: number;
    agent: string | undefined;
}

export default class Session implements SessionInterface {
    id: string;
    loginTime: Date;
    user: number;
    agent: string | undefined;

    constructor(data: SessionInterface) {
        this.id = data.id;
        this.loginTime = data.loginTime;
        this.user = data.user;
        this.agent = data.agent;
    }
}