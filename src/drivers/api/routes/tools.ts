import SessionController from "../../../adapters/controllers/Session";
import { Request, RequestHandler } from "express";
import { Context } from "../../interfaces";
import { AccountPermission } from "../../../entities/User";
import UserRepository from "../../../adapters/models/User";

export async function getToken(header: string | undefined) {
    if (!header) throw { message: 'Não autenticado', status: 401 };
    return header.split(' ')[1];
}

export async function checkAuth(req: Request<any>, context: Context) {
    const token = await getToken(req.headers.authorization);
    const controller = new SessionController(context);
    return controller.checkToken(token);
}

export function checkPermission(context: Context, permissions: AccountPermission[]): RequestHandler {
    return async (req, res, next) => {
        try {
            const user = await checkAuth(req, context);
            const userRepository = new UserRepository(context);
            if (permissions.indexOf(user.permission) > -1) {
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