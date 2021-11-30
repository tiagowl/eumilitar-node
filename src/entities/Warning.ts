export interface WarningInterface {
    readonly id: number;
    title: string;
    lastModified: Date;
    active: boolean;
    message?: string;
    image?: string;
}

export default class Warning implements WarningInterface {
    readonly id: number;
    public title: string;
    public message?: string;
    public lastModified: Date;
    public active: boolean;
    public image?: string;

    constructor(data: WarningInterface) {
        this.id = data.id;
        this.title = data.title;
        this.message = data.message;
        this.lastModified = data.lastModified;
        this.active = data.active;
        this.image = data.image;
    }
}