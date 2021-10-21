import { UserService } from '../src/adapters/models/User';
import { SessionService } from '../src/adapters/models/Session';
import { contextFactory, hottok, createEssay, deleteUser, db, generateConfirmationToken, saveConfirmationToken, saveUser, userFactory, mails } from './shortcuts';
import { RecoveryService } from '../src/adapters/models/Recovery';
import crypto from 'crypto';
import EssayThemeRepository, { EssayThemeService } from '../src/adapters/models/EssayTheme';
import { EssayThemeCreation } from '../src/cases/EssayTheme';
import { Course } from '../src/entities/EssayTheme';
import faker from 'faker';
import EssayThemeController, { EssayThemeInput, EssayThemePagination } from '../src/adapters/controllers/EssayTheme';
import { Readable } from 'stream';
import EssayController, { EssayInput } from '../src/adapters/controllers/Essay';
import EssayInvalidationController from '../src/adapters/controllers/EssayInvalidation';
import CorrectionController from '../src/adapters/controllers/Correction';
import UserController from '../src/adapters/controllers/User';
import SubscriptionRepository, { SubscriptionService } from '../src/adapters/models/Subscription';
import ProductRepository, { ProductModel, ProductService } from '../src/adapters/models/Product';
import SubscriptionController from '../src/adapters/controllers/Subscription';
import ProductController from '../src/adapters/controllers/Products';
import { ProductCreation } from '../src/cases/Product';
import User from '../src/entities/User';
import { UserCreation, UserUpdate } from '../src/cases/User';
import SessionController from '../src/adapters/controllers/Session';
import RecoveryController from '../src/adapters/controllers/Recovery';
import SingleEssayController from '../src/adapters/controllers/SingleEssay';
import { v4 } from 'uuid';
import { CorrectionService } from '../src/adapters/models/Correction';

afterAll(async (done) => {
    await db.destroy();
    done();
})

const context = contextFactory();


