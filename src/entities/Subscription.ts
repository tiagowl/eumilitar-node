export interface SubscriptionInterface {
    id: number;
    product: number;
    user: number;
    expiration: Date;
    registrationDate: Date;
    code: number;
}

export default class Subscription implements SubscriptionInterface {
    public readonly id: number;
    public product: number;
    public user: number;
    public expiration: Date;
    public registrationDate: Date;
    public code: number;

    constructor(data: SubscriptionInterface) {
        this.id = data.id;
        this.product = data.product;
        this.user = data.user;
        this.expiration = data.expiration;
        this.registrationDate = data.registrationDate;
        this.code = data.code;
    }
}