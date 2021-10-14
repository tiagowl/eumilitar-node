import SingleEssay, { SingleEssayInterface } from "../entities/SingleEssay";
import crypto from 'crypto';
import CaseError, { Errors } from "./Error";

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
    readonly get: (filter: Partial<SingleEssayInterface>) => Promise<SingleEssay | undefined>;
}

export interface CheckEssayTokenInterface {
    token: string;
    student: number;
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

    private async generateToken(): Promise<string> {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(32, (error, buffer) => {
                if (error) reject(error);
                else resolve(buffer.toString('hex'));
            });
        });
    }

    public async create(data: SingleEssayCreation) {
        return this.repository.create({
            ...data,
            token: await this.generateToken(),
            registrationDate: new Date(),
            expiration: new Date(Date.now() + this.settings.expiration),
        });
    }

    public async checkToken(data: CheckEssayTokenInterface) {
        const single = await this.repository.get(data);
        if (!single) throw new CaseError('Token inválido', Errors.UNAUTHORIZED);
        if (single.expiration < new Date()) throw new CaseError('Token expirado', Errors.EXPIRED);
        return single;
    }
}