import faker from "faker";
import supertest from "supertest";
import { jp } from "../../../tests/shortcuts";
import { UserModel } from "../../adapters/models/UserRepository";

export async function authenticate(user: UserModel, api: supertest.SuperTest<supertest.Test>) {
    const credentials = {
        email: user.email,
        password: user.passwd,
    };
    const auth = await api.post('/tokens/')
        .send(credentials)
        .set('User-Agent', faker.internet.userAgent());
    const { token } = auth.body;
    expect(token, jp({ body: auth.body, credentials, })).toBeDefined();
    expect(typeof token).toBe('string');
    return `Bearer ${token}`;
}