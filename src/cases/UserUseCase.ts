import User from "../entities/User";
import UseCase from "./UseCase";
import bcrypt from 'bcrypt';

export default class UserUseCase extends UseCase<User> {
    #saltRounds: number = 10;

    public async authenticate(email: string, password: string) {
        const user = await this.repository.get({ email });
        return { 
          email: !!user,
          password: !!user && await user.checkPassword(password, bcrypt.compare)
        }
    }

    private async hashPassword(password: string) {
        const salt = await bcrypt.genSalt(this.#saltRounds);
        return bcrypt.hash(password, salt);
    }

}
