export interface WarningInterface {
    readonly id: number;
    title: string;
    message: string;
}

export default class Warning implements WarningInterface {
    readonly id: number;
    public title: string;
    public message: string;

    constructor(data: WarningInterface) {
        this.id = data.id;
        this.title = data.title;
        this.message = data.message;
    }
}