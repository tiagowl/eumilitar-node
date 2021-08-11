import express, { RequestHandler, Request } from "express";
import { Knex } from "knex";
import AuthController, { AuthInterface, AuthResponse } from "../../adapters/controllers/Auth";
import ChangePasswordController, { ChangePasswordInterface, ChangePasswordResponse } from "../../adapters/controllers/ChangePassword";
import CheckPasswordToken, { CheckPasswordInterface, CheckedTokenInterface } from "../../adapters/controllers/CheckPasswordToken";
import CorrectionController from "../../adapters/controllers/Correction";
import EssayController, { EssayInput, EssayResponse } from "../../adapters/controllers/Essay";
import EssayInvalidationController from "../../adapters/controllers/EssayInvalidation";
import EssayThemeController, { EssayThemeResponse } from "../../adapters/controllers/EssayTheme";
import PasswordRecoveryController, { PasswordRecoveryInterface, PasswordRecoveryResponse } from "../../adapters/controllers/PasswordRecovery";
import ProductController from "../../adapters/controllers/Products";
import SubscriptionController, { CancelData, OrderData } from "../../adapters/controllers/Subscription";
import UserController from "../../adapters/controllers/User";
import { ProductCreation } from "../../cases/ProductCase";
import { CorrectionInterface } from "../../entities/Correction";
import { EssayInvalidationInterface, Reason } from "../../entities/EssayInvalidation";
import { Course } from "../../entities/EssayTheme";
import { ProductInterface } from "../../entities/Product";
import { SubscriptionInterface } from "../../entities/Subscription";
import User, { AccountPermission, UserInterface } from "../../entities/User";
import { Context } from "../interfaces";

interface EssayThemeRequest {
    title: string;
    startDate: Date;
    endDate: Date;
    helpText: string;
    courses: Course[];
}

interface EssayInvalidationRequest {
    reason: Reason;
    comment?: string;
}

interface CorrectionRequest {
    isReadable: string;
    hasMarginSpacing: string;
    obeyedMargins: string;
    erased: string;
    orthography: string;
    accentuation: string;
    agreement: string;
    repeated: string;
    veryShortSentences: string;
    understoodTheme: string;
    followedGenre: string;
    cohesion: string;
    organized: string;
    conclusion: string;
    comment: string;
    points: number;
}

async function getToken(header: string | undefined) {
    if (!header) throw { message: 'Não autenticado', status: 401 };
    return header.split(' ')[1];
}


async function checkAuth(req: Request, context: Context) {
    const token = await getToken(req.headers.authorization);
    const controller = new AuthController(context);
    const { user, isValid } = await controller.checkToken({ token },);
    if (!isValid || !user) throw { message: 'Não autorizado', status: 401 };
    return user;
}

function checkPermission(context: Context, permissions: AccountPermission[]): RequestHandler {
    return async (req, res, next) => {
        try {
            const user = await checkAuth(req, context);
            if (permissions.indexOf(user.permission) > -1) {
                req.user = user;
                next();
            } else {
                res.status(403).json({ message: 'Não autorizado', status: 403 });
                res.end();
            }
        } catch (error) {
            res.status(error.status || 400).json(error);
            res.end();
        }
    };
}

function isAuthenticated(context: Context): RequestHandler {
    return async (req, res, next) => {
        try {
            const user = await checkAuth(req, context);
            if (!user) {
                res.status(401).json({ message: 'Não autorizado', status: 401 });
                res.end();
            } else {
                req.user = user;
                next();
            }
        } catch (error) {
            res.status(error.status || 400).json(error);
            res.end();
        }
    };
}

export function createToken(context: Context): RequestHandler<any, AuthResponse, AuthInterface> {
    return async (req, res) => {
        try {
            const controller = new AuthController(context);
            const response = await controller.auth(req.body, req.get('User-Agent'));
            res.status(!!response.token ? 201 : 400);
            res.json(response);
        } catch (error) {
            res.status(400);
            res.json(error);
        } finally {
            res.end();
        }
    };
}

export function logOut(context: Context): RequestHandler<any, void, void> {
    return async (req, res) => {
        try {
            await checkAuth(req, context);
            const controller = new AuthController(context);
            const token = await getToken(req.headers.authorization);
            await controller.logOut(token);
            res.status(204);
        } catch (error) {
            res.status(error.status || 400).json(error);
        } finally {
            res.end();
        }
    };
}

export function passwordRecoveries(context: Context): RequestHandler<any, PasswordRecoveryResponse, PasswordRecoveryInterface> {
    return async (req, res) => {
        try {
            const controller = new PasswordRecoveryController(context);
            const response = await controller.recover(req.body);
            res.status(201).json(response);
        } catch (error) {
            res.status(400).json(error);
        } finally {
            res.end();
        }
    };
}


export function checkChangePasswordToken(context: Context): RequestHandler<any, CheckedTokenInterface, CheckPasswordInterface> {
    return async (req, res) => {
        try {
            const controller = new CheckPasswordToken(context);
            const response = await controller.check(req.params);
            res.status(200).json(response);
        } catch (error) {
            res.status(500).json(error);
        } finally {
            res.end();
        }
    };
}

export function changePassword(context: Context): RequestHandler<any, ChangePasswordResponse, ChangePasswordInterface> {
    return async (req, res) => {
        try {
            const controller = new ChangePasswordController(context);
            const response = await controller.updatePassword(req.body);
            res.status(200).json(response);
        } catch (error) {
            res.status(400).json(error);
        } finally {
            res.end();
        }
    };
}


export function profile(context: Context): RequestHandler<any, UserInterface, void> {
    return async (req, res) => {
        try {
            const user = await checkAuth(req, context);
            res.status(200).json(user);
        } catch (error) {
            res.status(error.status || 500).json(error);
        } finally {
            res.end();
        }
    };
}

export function createEssayTheme(context: Context): RequestHandler<any, any, EssayThemeRequest> {
    const { storage } = context;
    return express().use(checkPermission(context, ['admin']), storage.single('themeFile'),
        async (req, res) => {
            try {
                const data = JSON.parse(req.body.data);
                const controller = new EssayThemeController(context);
                const response = await controller.create({
                    ...data,
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                    file: req.file
                });
                res.status(201).json(response);
            } catch (error) {
                res.status(error.status || 400).send(error);
            } finally {
                res.end();
            }
        }
    );
}

export function listEssayThemes(context: Context): RequestHandler {
    return express().use(isAuthenticated(context), async (req, res) => {
        try {
            const controller = new EssayThemeController(context);
            const themes = await controller.listAll(req.query);
            res.status(200).json(themes);
        } catch (error) {
            res.status(500).json(error);
        } finally {
            res.end();
        }
    });
}

export function updateEssayThemes(context: Context): RequestHandler<any, EssayThemeResponse, EssayThemeRequest> {
    const { storage } = context;
    const handler = express.Router({ mergeParams: true }).use(checkPermission(context, ['admin']), storage.single('themeFile'));
    handler.use(async (req, res) => {
        try {
            const { id } = req.params;
            const data = JSON.parse(req.body.data);
            const controller = new EssayThemeController(context);
            const response = await controller.update(Number(id), {
                ...data,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                file: req.file
            });
            res.status(200).json(response);
        } catch (error) {
            res.status(error.status || 400).send(error);
        } finally {
            res.end();
        }
    });
    return handler;
}

export function deactivateEssayTheme(context: Context): RequestHandler<any, EssayThemeResponse, undefined> {
    const handler = express.Router({ mergeParams: true }).use(checkPermission(context, ['admin']));
    handler.use(async (req, res) => {
        try {
            const controller = new EssayThemeController(context);
            const theme = await controller.deactivate(Number(req.params.id));
            res.status(200).json(theme);
        } catch (error) {
            res.status(error.status || 400).json(error);
        } finally {
            res.end();
        }
    });
    return handler;
}


export function createEssay(context: Context): RequestHandler<any, EssayResponse, EssayInput> {
    const { storage } = context;
    const handler = express.Router({ mergeParams: true }).use(isAuthenticated(context), storage.single('file'));
    handler.use(async (req, res) => {
        try {
            if (!req.user) throw { message: 'Não autenticado', status: 401 };
            const controller = new EssayController(context);
            const response = await controller.create({
                course: req.body.course, file: (req.file as Express.MulterS3.File), student: req.user.id
            });
            res.status(201).json(response);
        } catch (error) {
            res.status(error.status || 400).json(error);
        } finally {
            res.end();
        }
    });
    return handler;
}

export function listEssays(context: Context): RequestHandler<any, EssayResponse[], void> {
    const handler = express.Router({ mergeParams: true }).use(isAuthenticated(context));
    handler.use(async (req, res) => {
        try {
            const { user, query } = req;
            if (!user) throw { message: 'Não autenticado', status: 401 };
            const controller = new EssayController(context);
            if (['admin', 'corrector'].indexOf(user.permission) > -1) {
                const response = await controller.allEssays(query);
                res.status(200).json(response);
            } else {
                const response = await controller.myEssays(user.id);
                res.status(200).json(response);
            }
        } catch (error) {
            res.status(error.status || 400).json(error);
        } finally {
            res.end();
        }
    });
    return handler;
}

export function getEssay(context: Context): RequestHandler<{ id: string }, EssayResponse, void> {
    const handler = express.Router({ mergeParams: true }).use(checkPermission(context, ['admin', 'corrector']));
    handler.use(async (req, res) => {
        try {
            const { id } = req.params;
            const controller = new EssayController(context);
            const response = await controller.get(Number(id));
            res.status(200).json(response);
        } catch (error) {
            res.status(error.status || 400).json(error);
        } finally {
            res.end();
        }
    });
    return handler;
}

export function createEssayCorrector(context: Context): RequestHandler<{ id: string }, EssayResponse, void> {
    const handler = express.Router({ mergeParams: true }).use(checkPermission(context, ['admin', 'corrector']));
    handler.use(async (req, res) => {
        try {
            const { id } = req.params;
            const { user } = req;
            const controller = new EssayController(context);
            const response = await controller.partialUpdate(Number(id), { corrector: user?.id, status: 'correcting' });
            res.status(201).json(response);
        } catch (error) {
            res.status(error.status || 400).json(error);
        } finally {
            res.end();
        }
    });
    return handler;
}


export function deleteEssayCorrector(context: Context): RequestHandler<{ id: string }, EssayResponse, void> {
    const handler = express.Router({ mergeParams: true }).use(checkPermission(context, ['admin', 'corrector']));
    handler.use(async (req, res) => {
        try {
            const { id } = req.params;
            const { user } = req;
            const controller = new EssayController(context);
            const response = await controller.cancelCorrecting(Number(id), user?.id as number);
            res.status(200).json(response);
        } catch (error) {
            res.status(error.status || 400).json(error);
        } finally {
            res.end();
        }
    });
    return handler;
}

export function invalidateEssay(context: Context): RequestHandler<{ id: string }, EssayInvalidationInterface, EssayInvalidationRequest> {
    const handler = express.Router({ mergeParams: true }).use(checkPermission(context, ['admin', 'corrector']));
    handler.use(async (req, res) => {
        try {
            const { id } = req.params;
            const { user } = req;
            const controller = new EssayInvalidationController(context);
            const response = await controller.create({ ...req.body, essay: Number(id), corrector: Number(user?.id) });
            res.status(201).json(response);
        } catch (error) {
            res.status(error.status || 500).json(error);
        } finally {
            res.end();
        }
    });
    return handler;
}

export function correctEssay(context: Context): RequestHandler<{ id: string }, CorrectionInterface, CorrectionRequest> {
    const handler = express.Router({ mergeParams: true }).use(checkPermission(context, ['admin', 'corrector']));
    handler.use(async (req, res) => {
        try {
            const { id } = req.params;
            const { user } = req;
            const controller = new CorrectionController(context);
            const response = await controller.create({ ...req.body, essay: Number(id), corrector: Number(user?.id) });
            res.status(201).json(response);
        } catch (error) {
            res.status(error.status || 500).json(error);
        } finally {
            res.end();
        }
    });
    return handler;
}

export function getCorrection(context: Context): RequestHandler<{ id: string }, CorrectionInterface, void> {
    const handler = express.Router({ mergeParams: true }).use(isAuthenticated(context));
    handler.use(async (req, res) => {
        try {
            const { id } = req.params;
            const controller = new CorrectionController(context);
            const response = await controller.get({ essay: Number(id) });
            res.status(200).json(response);
        } catch (error) {
            res.status(error.status || 500).json(error);
        } finally {
            res.end();
        }
    });
    return handler;
}

export function listUsers(context: Context) {
    const handler = express.Router({ mergeParams: true }).use(checkPermission(context, ['admin']));
    handler.use(async (req, res) => {
        try {
            const controller = new UserController(context);
            const response = await controller.all(req.query || {});
            res.status(200).json(response);
        } catch (error) {
            res.status(error.status || 500).json(error);
        } finally {
            res.end();
        }
    });
    return handler;
}


export function getInvalidation(context: Context) {
    const handler = express.Router({ mergeParams: true }).use(isAuthenticated(context));
    handler.use(async (req, res) => {
        try {
            const { id } = req.params;
            const controller = new EssayInvalidationController(context);
            const response = await controller.get(Number(id));
            res.status(200).json(response);
        } catch (error) {
            res.status(error.status || 500).json(error);
        } finally {
            res.end();
        }
    });
    return handler;
}

export function createSubscription(context: Context): RequestHandler<void, SubscriptionInterface[], OrderData> {
    return async (req, res) => {
        try {
            const controller = new SubscriptionController(context);
            const created = await controller.create({
                ...req.body,
                'prod': Number(req.body.prod),
            });
            res.status(201).json(created);
        } catch (error) {
            res.status(error.status || 500).json(error);
        } finally {
            res.end();
        }
    };
}

export function cancelSubscription(context: Context): RequestHandler<void, SubscriptionInterface, CancelData> {
    return async (req, res) => {
        try {
            const controller = new SubscriptionController(context);
            const canceled = await controller.cancel(req.body);
            res.status(200).json(canceled);
        } catch (error) {
            res.status(error.status || 500).json(error);
        } finally {
            res.end();
        }
    };
}

export function createProduct(context: Context) {
    const handler = express.Router({ mergeParams: true }).use(checkPermission(context, ['admin']));
    return handler.use(async (req, res) => {
        try {
            const controller = new ProductController(context);
            const created = await controller.create(req.body);
            res.status(201).json(created);
        } catch (error) {
            res.status(error.status || 500).json(error);
        } finally {
            res.end();
        }
    });
}

export function listProducts(context: Context) {
    const handler = express.Router({ mergeParams: true }).use(checkPermission(context, ['admin']));
    return handler.use(async (_req, res) => {
        try {
            const controller = new ProductController(context);
            const products = await controller.list();
            res.status(200).json(products);
        } catch (error) {
            res.status(error.status || 500).json(error);
        } finally {
            res.end();
        }
    });
}

export function updateProduct(context: Context) {
    const handler = express.Router({ mergeParams: true }).use(checkPermission(context, ['admin']));
    return handler.use(async (req, res) => {
        try {
            const { id } = req.params;
            const controller = new ProductController(context);
            const product = await controller.fullUpdate(Number(id), req.body);
            res.status(200).json(product);
        } catch (error) {
            res.status(error.status || 500).json(error);
        } finally {
            res.end();
        }
    });
}

export function listSubscriptions(context: Context) {
    const handler = express.Router({ mergeParams: true }).use(isAuthenticated(context));
    return handler.use(async (req, res) => {
        try {
            const controller = new SubscriptionController(context);
            const subscriptions = await controller.mySubscriptions(req.user?.id || 0);
            res.status(200).json(subscriptions);
        } catch (error) {
            res.status(error.status || 500).json(error);
        } finally {
            res.end();
        }
    });
}