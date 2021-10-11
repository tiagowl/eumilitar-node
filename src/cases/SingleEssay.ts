import SingleEssay from "../entities/SingleEssay";
import uuid from 'uuid';

export interface SingleEssayInsertionInterface {
    theme: number;
    student: number;
    token: string;
    registrationDate: Date;
    expiration: Date;
    sentDate?: Date;
    essay?: number;
}

export interface SingleEssayCreation {
    theme: number;
    student: number;
}

export interface SingleEssayRepositoryInterface {
    readonly create: (data: SingleEssayInsertionInterface) => Promise<SingleEssay>;
}

export interface SingleEssayCaseSettings {
    readonly expiration: number;
}

export default class SingleEssayCase {
    private readonly repository: SingleEssayRepositoryInterface;
    private readonly settings: SingleEssayCaseSettings;

    constructor(repository: SingleEssayRepositoryInterface, settigs: SingleEssayCaseSettings) {
        this.repository = repository;
        this.settings = settigs;
    }

    public async create(data: SingleEssayCreation) {
        return this.repository.create({
            ...data,
            token: uuid.v4(),
            registrationDate: new Date(),
            expiration: new Date(Date.now() + this.settings.expiration),
        });
    }
}