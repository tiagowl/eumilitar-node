export interface SettingsInterface {
    readonly id: number;
    lastModified: Date;
    reviewExpiration: number;
    reviewRecuseExpiration: number;
    sellCorrections: boolean;
}

export default class Settings implements SettingsInterface {
    public readonly id: number;
    public lastModified: Date;
    public reviewExpiration: number;
    public reviewRecuseExpiration: number;
    public sellCorrections: boolean;

    constructor(data: SettingsInterface) {
        this.id = data.id;
        this.lastModified = data.lastModified;
        this.reviewExpiration = data.reviewExpiration;
        this.reviewRecuseExpiration = data.reviewRecuseExpiration;
        this.sellCorrections = data.sellCorrections;
    }
}