
export interface SingleEssayInterface {
    id: number;
    theme: number;
    student: number;
    token: string;
    registrationDate: Date;
    expiration: Date;
    sentDate?: Date;
    essay?: number;
}

export default class SingleEssay implements SingleEssayInterface {
    public readonly id: number;
    public theme: number;
    public student: number;
    public token: string;
    public registrationDate: Date;
    public expiration: Date;
    public sentDate?: Date;
    public essay?: number;

    constructor(data: SingleEssayInterface) {
        this.id = data.id;
        this.theme = data.theme;
        this.student = data.student;
        this.token = data.token;
        this.registrationDate = data.registrationDate;
        this.expiration = data.expiration;
        this.sentDate = data.sentDate;
        this.essay = data.essay;
    }
}