import SingleEssay, { SingleEssayInterface } from "../entities/SingleEssay";
import crypto from 'crypto';
import CaseError, { Errors } from "./Error";
import { createMethod, deleteMethod, getMethod, updateMethod } from "./interfaces";

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
    readonly create: createMethod<SingleEssayInsertionInterface, SingleEssay>;
    readonly get: getMethod<SingleEssay, SingleEssayInterface>;
    readonly delete: deleteMethod<SingleEssay>;
    readonly update: updateMethod<SingleEssay, SingleEssayInterface>;
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
        if (!single || single.student !== data.student) throw new CaseError('Token inválido', Errors.UNAUTHORIZED);
        if (single.expiration < new Date()) throw new CaseError('Token expirado', Errors.EXPIRED);
        if (single.essay) throw new CaseError('Link já utilizado', Errors.UNAUTHORIZED);
        return single;
    }

    public async update(id: number, data: Partial<SingleEssayInterface>) {
        const updating = await this.repository.get({ id });
        if (!updating) throw new CaseError('Token não encontrado', Errors.NOT_FOUND);
        return this.repository.update(id, data);
    }
}