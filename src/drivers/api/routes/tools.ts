import SessionController from "../../../adapters/controllers/SessionController";
import { Request, RequestHandler } from "express";
import { Context } from "../../interfaces";
import User, { AccountPermission, Permissions } from "../../../entities/User";
import UserRepository from "../../../adapters/models/UserRepository";
import UserController from "../../../adapters/controllers/UserController";

export async function getToken(header: string | undefined) {
    if (!header) throw { message: 'Não autenticado', status: 401 };
    return header.split(' ')[1];
}

export async function checkAuth(req: Request<any>, context: Context) {
    const token = await getToken(req.headers.authorization);
    const controller = new SessionController(context);
    return controller.checkToken(token);
}

export function checkPermission(context: Context, roles: AccountPermission[], permissions?: Permissions[]): RequestHandler {
    const controller = new UserController(context);
    return async (req, res, next) => {
        try {
            const user = await checkAuth(req, context);
            const userRepository = new UserRepository(context);
            const isAdmin = new Set(roles).has('admin');
            const hasPermission = (!!permissions && isAdmin) ? await controller.hasPermissions(user.id, permissions) : true;
            if (new Set(roles).has(user.permission) && hasPermission) {
                req.user = await userRepository.get({ id: user.id });
                next();
            } else {
                res.status(403).json({ message: 'Não autorizado', status: 403 });
                res.end();
            }
        } catch (error: any) {
            res.status(error.status || 400).json(error);
            res.end();
        }
    };
}

export function isAuthenticated(context: Context): RequestHandler {
    return async (req, res, next) => {
        try {
            const user = await checkAuth(req, context);
            const userRepository = new UserRepository(context);
            if (!user) {
                res.status(401).json({ message: 'Não autorizado', status: 401 });
                res.end();
            } else {
                req.user = await userRepository.get({ id: user.id });
                next();
            }
        } catch (error: any) {
            res.status(error.status || 400).json(error);
            res.end();
        }
    };
}