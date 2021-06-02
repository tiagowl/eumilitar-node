import User, { UserInterface } from '../../entities/User';

export async function UserView(user: User): Promise<UserInterface> {
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        permission: user.permission,
        creationDate: user.creationDate,
        lastModified: user.lastModified,
    };
}