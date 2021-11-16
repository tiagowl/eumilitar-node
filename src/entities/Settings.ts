export interface SettingsInterface {
    readonly id: number;
    lastModified: Date;
    reviewExpiration: number;
}

export default class Settings implements SettingsInterface {
    public readonly id: number;
    public lastModified: Date;
    public reviewExpiration: number;

    constructor(data: SettingsInterface) {
        this.id = data.id;
        this.lastModified = data.lastModified;
        this.reviewExpiration = data.reviewExpiration;
    }
}