import Recovery, { RecoveryInterface } from "../entities/Recovery";
import CaseError, { Errors } from "./Error";
import UserUseCase, { UserRepositoryInterface } from "./UserUseCase";
import crypto from "crypto";

export interface RecoveryInsertionInterface {
    token: string;
    expires: Date;
    user: number;
    selector: string;
}

export interface UpdatePasswordData {
    token: string;
    password: string;
}

export interface RecoveryRepositoryInterface {
    readonly users: UserRepositoryInterface;
    readonly create: (data: RecoveryInsertionInterface) => Promise<Recovery>;
    readonly get: (filter: Partial<RecoveryInterface>) => Promise<Recovery | null | undefined>;
    readonly delete: (filter: Partial<RecoveryInterface>) => Promise<number>;
}

export default class RecoveryCase {
    private readonly repository: RecoveryRepositoryInterface;
    private readonly defaultExpiration: number;

    constructor(repository: RecoveryRepositoryInterface, defaultExpiration: number) {
        this.repository = repository;
        this.defaultExpiration = defaultExpiration;
    }

    private async generateLongToken(): Promise<string> {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(32, (error, buffer) => {
                if (error) reject(error);
                else resolve(buffer.toString('hex'));
            });
        });
    }

    private async generateShortToken(): Promise<string> {
        const list = new Array(6).fill(undefined);
        const numberList = await Promise.all(list.map(async () => {
            return Math.round(Math.random() * (9 - 0));
        }));
        return numberList.join('');
    }

    private async generateConfirmationToken(long: boolean): Promise<string> {
        return long ? this.generateLongToken() : this.generateShortToken();
    }

    public async create(email: string, long: boolean = true) {
        const user = await this.repository.users.get({ email });
        if (!user) throw new CaseError(`Email inválido`, Errors.NOT_FOUND);
        return {
            user,
            recovery: await this.repository.create({
                token: await this.generateConfirmationToken(long),
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
        if (expired) {
            this.repository.delete({ token });
            throw new CaseError('Token expirado', Errors.EXPIRED);
        }
        return recovery;
    }

    public async updatePassword(data: UpdatePasswordData) {
        const { token, password } = data;
        const recovery = await this.check(token);
        const userCase = new UserUseCase(this.repository.users);
        const updated = await userCase.updatePassword(recovery.user, password);
        if (updated) await this.repository.delete({ token });
        else throw new CaseError('Falha ao atualizar senha');
        return updated;
    }
}