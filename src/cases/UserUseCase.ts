import User, { AccountStatus } from "../entities/User";
import UseCase from "./UseCase";
import bcrypt from 'bcrypt';

export interface UserFilter {
    id?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    status?: AccountStatus;
    creationDate?: Date;
    lastModified?: Date;
}

export default class UserUseCase extends UseCase<User, UserFilter> {
    #saltRounds: number = 10;
    #user: User | undefined | null;

    public async authenticate(email: string, password: string) {
        try {
            const user = await this.repository.get({ email });
            this.#user = user;
            return {
                email: !!user,
                password: !!user && await user.checkPassword(password, bcrypt.compare)
            }
        } catch (error) {
            return {
                email: false,
                password: false,
            }
        }
    }

    get user() { return this.#user }

    private async hashPassword(password: string) {
        const salt = await bcrypt.genSalt(this.#saltRounds);
        return bcrypt.hash(password, salt);
    }

    public async updatePassword(id: number, password: string) {
        this.#user = await this.repository.get({ id });
        if(!!this.#user) {
            this.#user.password = await this.hashPassword(password);
            const filtered = await this.repository.filter({ id });
            const amount = await filtered.update(this.#user);
            if(amount > 1) throw new Error('Mais de um usuário afetado');
            return !!amount;
        }
        return false;
    }

}
