import Recovery, { RecoveryInterface } from "../entities/Recovery";
import CaseError, { Errors } from "./Error";
import { UserRepositoryInterface } from "./UserUseCase";
import crypto from "crypto";

export interface RecoveryInsertionInterface {
    token: string;
    expires: Date;
    user: number;
    selector: string;
}

export interface RecoveryRepositoryInterface {
    readonly users: UserRepositoryInterface;
    readonly create: (data: RecoveryInsertionInterface) => Promise<Recovery>;
    readonly get: (filter: Partial<RecoveryInterface>) => Promise<Recovery | null | undefined>;
}

export default class RecoveryCase {
    private readonly repository: RecoveryRepositoryInterface;
    private readonly defaultExpiration: number;

    constructor(repository: RecoveryRepositoryInterface, defaultExpiration: number) {
        this.repository = repository;
        this.defaultExpiration = defaultExpiration;
    }

    private async generateConfirmationToken(): Promise<string> {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(32, (error, buffer) => {
                if (error) reject(error);
                else resolve(buffer.toString('hex'));
            });
        });
    }

    public async create(email: string) {
        const user = await this.repository.users.get({ email });
        if (!user) throw new CaseError(`Email inválido`, Errors.NOT_FOUND);
        return {
            user,
            recovery: await this.repository.create({
                token: await this.generateConfirmationToken(),
                expires: new Date(Date.now() + this.defaultExpiration),
                user: user.id,
                selector: crypto.randomBytes(24).toString('hex').substring(0, 16),
            }),
        };
    }

    public async check(token: string) {
        const recovery = await this.repository.get({ token });
        if (!recovery) throw new CaseError('Token inválido', Errors.NOT_FOUND);
        const expired = recovery.expires <= new Date();
        if (expired) throw new CaseError('Token expirado', Errors.EXPIRED);
        return true;
    }
}