import UserUseCase, { UserFilter } from '../src/cases/UserUseCase';
import { RepositoryInterface } from '../src/cases/interfaces';
import User from '../src/entities/User';
import bcrypt from 'bcrypt';

describe('Testes nos casos de uso da entidade User', () => {
    it('Autenticação', () => {
        const userEmail = 'teste@gmail.com'
        const userPassword = 'password'
        const repository: RepositoryInterface<User, UserFilter> = {
            get: async () => (new User({
                id: 5,
                email: userEmail,
                firstName: 'John',
                lastName: 'Doe',
                password: bcrypt.hashSync(userPassword, 10),
                creationDate: new Date(),
                lastModified: new Date(),
                permission: 'admin',
                status: 'active',
            }))
        }
        const useCase = new UserUseCase(repository);
        const auth = useCase.authenticate(userEmail, userPassword)
        expect(auth).toBeTruthy()
    })
})