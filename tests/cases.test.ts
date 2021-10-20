import UserUseCase, { UserFilter, UserRepositoryInterface, UserSavingData } from '../src/cases/User';
import { hashPassword, userEntityFactory } from './shortcuts';
import EssayThemeCase, { EssayThemeCreation, EssayThemeData, EssayThemeFilter, EssayThemeRepositoryInterface } from '../src/cases/EssayTheme';
import EssayTheme, { Course } from '../src/entities/EssayTheme';
import faker, { fake } from 'faker';
import EssayCase, { EssayChartFilter, EssayCreationData, EssayInsertionData, EssayInvalidationData, EssayPagination, EssayRepositoryInterface } from '../src/cases/Essay';
import Essay, { EssayInterface } from '../src/entities/Essay';
import User from '../src/entities/User';
import EssayInvalidation from '../src/entities/EssayInvalidation';
import EssayInvalidationCase, { EssayInvalidationRepositoryInterface } from '../src/cases/EssayInvalidation';
import Correction, { CorrectionInterface } from '../src/entities/Correction';
import CorrectionCase, { CorrectionBase, CorrectionInsertionData, CorrectionRepositoryInterface } from '../src/cases/Correction';
import ProductCase, { ProductCreation, ProductRepositoryInterface } from '../src/cases/Product';
import Product, { ProductInterface } from '../src/entities/Product';
import SubscriptionCase, { ChartFilter, SubscriptionInsertionInterface, SubscriptionRepositoryInterface } from '../src/cases/Subscription';
import Subscription, { SubscriptionInterface } from '../src/entities/Subscription';
import SessionCase, { SessionInsertionInterface, SessionRepositoryInterface } from '../src/cases/Session';
import RecoveryCase, { RecoveryInsertionInterface, RecoveryRepositoryInterface } from '../src/cases/Recovery';
import SingleEssayCase, { SingleEssayInsertionInterface, SingleEssayRepositoryInterface } from '../src/cases/SingleEssay';
import Session, { SessionInterface } from '../src/entities/Session';
import Recovery, { RecoveryInterface } from '../src/entities/Recovery';
import { Chart } from '../src/cases/interfaces';
import { v4 } from 'uuid';
import SingleEssay, { SingleEssayInterface } from '../src/entities/SingleEssay';
import { uniqueId } from 'lodash';

const defaultPassword = 'pass1235'
const userDatabase = new Array(5).fill(0).map((_, id) => userEntityFactory({ password: hashPassword(defaultPassword), id }));
const essayThemeDatabase = new Array(5).fill(0).map((_, index) => new EssayTheme({
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
const essayDatabase = new Array(5).fill(0).map((_, index) => new Essay({
    file: '/usr/share/data/theme.pdf',
    course: 'esa',
    lastModified: new Date(),
    id: index,
    student: 6,
    theme: faker.datatype.number(),
    status: 'pending',
    sendDate: faker.date.past(),
}));
const essayInvalidationDatabase = new Array(3).fill(0).map((_, id) => new EssayInvalidation({ id, corrector: 0, essay: id, reason: 'invalid', invalidationDate: new Date() }))
const productsDatabase = new Array(5).fill(0).map((_, id) => new Product({
    id,
    code: id * 10,
    course: 'esa',
    name: faker.lorem.sentence(),
    expirationTime: 360 * 24 * 60 * 60 * 1000,
}));
const correctionDatabase = new Array(5).fill(0).map((_, id) => new Correction({
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
}))
const singleDatabase = new Array(5).fill(0).map((_, id) => new SingleEssay({
    id,
    theme: faker.datatype.number(essayThemeDatabase.length),
    student: faker.datatype.number(userDatabase.length),
    token: uniqueId(),
    registrationDate: new Date(),
    expiration: faker.date.future(),
}));



// tslint:disable-next-line

// tslint:disable-next-line


// tslint:disable-next-line


// tslint:disable-next-line

// tslint:disable-next-line

// tslint:disable-next-line

// tslint:disable-next-line

// tslint:disable-next-line





