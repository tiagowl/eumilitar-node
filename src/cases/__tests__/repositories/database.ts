import faker from "faker";
import { uniqueId } from "lodash";
import { hashPassword, userEntityFactory } from "../../../../tests/shortcuts";
import Correction from "../../../entities/Correction";
import Essay from "../../../entities/Essay";
import EssayInvalidation from "../../../entities/EssayInvalidation";
import EssayTheme, { Course } from "../../../entities/EssayTheme";
import Product from "../../../entities/Product";
import SingleEssay from "../../../entities/SingleEssay";
import Subscription from "../../../entities/Subscription";

export const defaultPassword = 'pass1235';
const users = new Array(5).fill(0).map((_, id) => userEntityFactory({ password: hashPassword(defaultPassword), id }));
const essayThemes = new Array(5).fill(0).map((_, index) => new EssayTheme({
    title: 'Título',
    endDate: new Date(Date.now() + 15 * 24 * 60 * 60),
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60),
    helpText: faker.lorem.lines(3),
    file: '/usr/share/data/theme.pdf',
    courses: new Set(['esa', 'espcex'] as Course[]),
    lastModified: new Date(),
    id: index,
    deactivated: false,
}));
const essays = new Array(5).fill(0).map((_, index) => new Essay({
    file: '/usr/share/data/theme.pdf',
    course: 'esa',
    lastModified: new Date(),
    id: index,
    student: 6,
    theme: faker.datatype.number(),
    status: 'pending',
    sendDate: faker.date.past(),
}));
const essayInvalidations = new Array(3).fill(0).map((_, id) => new EssayInvalidation({ id, corrector: 0, essay: id, reason: 'invalid', invalidationDate: new Date() }));
const products = new Array(5).fill(0).map((_, id) => new Product({
    id,
    code: id * 10,
    course: 'esa',
    name: faker.lorem.sentence(),
    expirationTime: 360 * 24 * 60 * 60 * 1000,
}));
const corrections = new Array(5).fill(0).map((_, id) => new Correction({
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
}));
const singles = new Array(5).fill(0).map((_, id) => new SingleEssay({
    id,
    theme: faker.datatype.number(essayThemes.length),
    student: faker.datatype.number(users.length),
    token: uniqueId(),
    registrationDate: new Date(),
    expiration: faker.date.future(),
}));
const subscriptions = users.reverse().map((user, id) => new Subscription({
    id,
    expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    registrationDate: new Date(),
    user: user.id,
    product: id,
    code: id,
    active: true,
    course: 'esa'
}));
export default function getDb() {
    return {
        users,
        essayThemes,
        essays,
        essayInvalidations,
        products,
        corrections,
        singles,
        subscriptions,
    } as const
};