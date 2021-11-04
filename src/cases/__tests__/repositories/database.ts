import faker from "faker";
import { uniqueId } from "lodash";
import { hashPassword, userEntityFactory } from "../../../../tests/shortcuts";
import { CorrectionInterface } from "../../../entities/Correction";
import { EssayInterface } from "../../../entities/Essay";
import { EssayInvalidationInterface } from "../../../entities/EssayInvalidation";
import { Course, EssayThemeInterface } from "../../../entities/EssayTheme";
import { ProductInterface } from "../../../entities/Product";
import { RecoveryInterface } from "../../../entities/Recovery";
import { SessionInterface } from "../../../entities/Session";
import { SingleEssayInterface } from "../../../entities/SingleEssay";
import { SubscriptionInterface } from "../../../entities/Subscription";
import Warning from "../../../entities/Warning";

export type FakeDB = ReturnType<typeof getDb>;

export const defaultPassword = 'pass1235';

export default function getDb() {
    const users = new Array(5).fill(0).map((_, id) => userEntityFactory({ password: hashPassword(defaultPassword), id }));
    const essayThemes = new Array(5).fill(0).map((_, index) => ({
        title: 'Título',
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60),
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60),
        helpText: faker.lorem.lines(3),
        file: '/usr/share/data/theme.pdf',
        courses: new Set(['esa', 'espcex'] as Course[]),
        lastModified: new Date(),
        id: index,
        deactivated: false,
    }) as EssayThemeInterface);
    const essays = new Array(5).fill(0).map((_, index) => ({
        file: '/usr/share/data/theme.pdf',
        course: 'esa',
        lastModified: new Date(),
        id: index,
        student: 6,
        theme: faker.datatype.number(),
        status: 'pending',
        sendDate: faker.date.past(),
    }) as EssayInterface);
    const essayInvalidations = new Array(3).fill(0).map((_, id) => ({
        id, corrector: 0, essay: id, reason: 'invalid', invalidationDate: new Date()
    }) as EssayInvalidationInterface);
    const products = new Array(5).fill(0).map((_, id) => ({
        id,
        code: id * 10,
        course: 'esa',
        name: faker.lorem.sentence(),
        expirationTime: 360 * 24 * 60 * 60 * 1000,
    }) as ProductInterface);
    const corrections = new Array(5).fill(0).map((_, id) => ({
        id, essay: id,
        'accentuation': "Sim",
        'agreement': "Sim",
        'cohesion': "Sim",
        'comment': faker.lorem.lines(5),
        'conclusion': "Sim",
        'erased': "Não",
        'followedGenre': "Sim",
        'hasMarginSpacing': "Sim",
        'isReadable': "Sim",
        'obeyedMargins': "Sim",
        'organized': "Sim",
        'orthography': "Sim",
        'points': faker.datatype.number(10),
        'repeated': "Não",
        'understoodTheme': "Sim",
        'veryShortSentences': "Não",
        'correctionDate': new Date(),
    }) as CorrectionInterface);
    const singles = new Array(5).fill(0).map((_, id) => ({
        id,
        theme: faker.datatype.number(essayThemes.length),
        student: faker.datatype.number(users.length),
        token: uniqueId(),
        registrationDate: new Date(),
        expiration: faker.date.future(),
    }) as SingleEssayInterface);
    const subscriptions = users.reverse().map((user, id) => ({
        id,
        expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        registrationDate: new Date(),
        user: user.id,
        product: id,
        code: id,
        active: true,
        course: 'esa'
    }) as SubscriptionInterface);
    const recoveries = new Array(10).fill(0).map((_, id) => ({
        id,
        expires: new Date(Date.now() + 60 * 60 * 1000),
        selector: faker.datatype.string(),
        token: faker.datatype.string(),
        user: id,
    }) as RecoveryInterface);
    const sessions = new Array(5).fill(0).map((_, id) => ({
        id,
        token: faker.random.alphaNumeric(),
        user: id,
        loginTime: new Date(),
        agent: faker.internet.userAgent(),
    }) as SessionInterface);
    const warnings = [new Warning({
        id: 0,
        title: 'Alerta de teste',
        message: faker.lorem.paragraph(3),
        lastModified: new Date(),
        active: true,
    })];
    return {
        users,
        essayThemes,
        essays,
        essayInvalidations,
        products,
        corrections,
        singles,
        subscriptions,
        recoveries,
        sessions,
        warnings,
    };
}
