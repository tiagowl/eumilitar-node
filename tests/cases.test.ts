import UserUseCase from '../src/cases/UserUseCase';
import { Repository } from '../src/cases/interfaces';
import User from '../src/entities/User';
import bcrypt from 'bcrypt';

describe('Testes nos casos de uso da entidade User', () => {
    it('Autenticação', () => {
        const userEmail = 'teste@gmail.com'
        const userPassword = 'password'
        const repository: Repository<User> = {
            get: async () => (new User({
                id: 5,
                email: userEmail,
                firstName: 'John',
                lastName: 'Doe',
                password: bcrypt.hashSync(userPassword, 10),
                creationDate: new Date(),
                lastModified: new Date(),
                status: 'active',
            }))
        }
        const useCase = new UserUseCase(repository);
        const auth = useCase.authenticate(userEmail, userPassword)
        expect(auth).toBeTruthy()
    })
})