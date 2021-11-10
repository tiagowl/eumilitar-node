export interface ReviewInterface {
    readonly id: number;
    grade: number;
    registrationDate: Date;
    user: number;
    description?: string;
}

export default class Review implements ReviewInterface {
    public readonly id: number;
    public grade: number;
    public registrationDate: Date;
    public user: number;
    public description?: string;

    constructor(data: ReviewInterface) {
        if (data.grade > 10 || data.grade < 1) throw new Error('Nota inválida');
        this.id = data.id;
        this.grade = data.grade;
        this.registrationDate = data.registrationDate;
        this.user = data.user;
        this.description = data.description;
    }
}