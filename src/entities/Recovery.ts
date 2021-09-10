export interface RecoveryInterface {
    id: number;
    token: string;
    expires: Date;
    user: number;
    selector: string;
}

export default class Recovery implements RecoveryInterface {
    readonly id: number;
    token: string;
    expires: Date;
    user: number;
    selector: string;

    constructor(data: RecoveryInterface) {
        this.id = data.id;
        this.token = data.token;
        this.expires = data.expires;
        this.user = data.user;
        this.selector = data.selector;
    }
}