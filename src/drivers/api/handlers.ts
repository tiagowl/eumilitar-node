import express, { RequestHandler, Request } from "express";
import { Knex } from "knex";
import AuthController, { AuthInterface, AuthResponse } from "../../adapters/controllers/Auth";
import ChangePasswordController, { ChangePasswordInterface, ChangePasswordResponse } from "../../adapters/controllers/ChangePassword";
import CheckAuthController from "../../adapters/controllers/CheckAuth";
import CheckPasswordToken, { CheckPasswordInterface, CheckedTokenInterface } from "../../adapters/controllers/CheckPasswordToken";
import EssayThemeController from "../../adapters/controllers/EssayTheme";
import PasswordRecoveryController, { PasswordRecoveryInterface, PasswordRecoveryResponse } from "../../adapters/controllers/PasswordRecovery";
import { Course } from "../../entities/EssayTheme";
import { UserInterface } from "../../entities/User";
import { Context } from "./interfaces";


interface EssayThemeRequest {
    title: string;
    startDate: Date;
    endDate: Date;
    helpText: string;
    courses: Course[];
}



export async function checkAuth(req: Request, driver: Knex) {
    const auth = req.headers.authorization;
    if (!auth) throw { message: 'Token não fornecido', status: 401 };
    const token = auth.split(' ')[1];
    const controller = new CheckAuthController(driver);
    const { user, isValid } = await controller.check({ token },);
    if (!isValid || !user) throw { message: 'Não autorizado', status: 401 }
    return user;
}

export function isAdmin({ driver }: Context): RequestHandler {
    return async (req, res, next) => {
        try {
            const user = await checkAuth(req, driver);
            if (user.permission !== 'admin') {
                res.status(401).json({ message: 'Não autorizado', status: 401 });
                res.end();
            } else {
                next();
            }
        } catch (error) {
            res.status(error.status || 400).json(error);
            res.end();
        }
    }
}

export function createToken({ driver }: Context): RequestHandler<any, AuthResponse, AuthInterface> {
    return async (req, res) => {
        try {
            const controller = new AuthController(driver);
            const response = await controller.auth(req.body, req.get('User-Agent'))
            res.status(!!response.token ? 201 : 400)
            res.json(response);
        } catch (error) {
            res.status(400)
            res.json(error)
        } finally {
            res.end()
        }
    }
}

export function passwordRecoveries({ driver, smtp, settings }: Context): RequestHandler<any, PasswordRecoveryResponse, PasswordRecoveryInterface> {
    return async (req, res) => {
        try {
            const controller = new PasswordRecoveryController(driver, smtp, settings.messageConfig);
            const response = await controller.recover(req.body);
            res.status(201).json(response);
        } catch (error) {
            res.status(400).json(error);
        } finally {
            res.end();
        }
    }
}


export function checkChangePasswordToken({ driver }: Context): RequestHandler<any, CheckedTokenInterface, CheckPasswordInterface> {
    return async (req, res) => {
        try {
            const controller = new CheckPasswordToken(driver);
            const response = await controller.check(req.params);
            res.status(200).json(response);
        } catch (error) {
            res.status(500).json(error);
        } finally {
            res.end();
        }
    }
}

export function changePassword({ driver }: Context): RequestHandler<any, ChangePasswordResponse, ChangePasswordInterface> {
    return async (req, res) => {
        try {
            const controller = new ChangePasswordController(driver);
            const response = await controller.updatePassword(req.body);
            res.status(200).json(response);
        } catch (error) {
            res.status(400).json(error)
        } finally {
            res.end();
        }
    }
}


export function profile({ driver }: Context): RequestHandler<any, UserInterface, void> {
    return async (req, res) => {
        try {
            const user = await checkAuth(req, driver);
            res.status(200).json(user);
        } catch (error) {
            res.status(error.status || 500).json(error);
        } finally {
            res.end();
        }
    }
}

export function createEssayTheme(context: Context): RequestHandler<any, EssayThemeRequest, any> {
    const { driver, storage } = context;
    return express().use(isAdmin(context), storage.single('themeFile'),
        async (req, res) => {
            try {
                const data = JSON.parse(req.body.data)
                const controller = new EssayThemeController(driver)
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
    )
}

export function listEssayThemes(context: Context): RequestHandler {
    const { driver } = context;
    return express().use(isAdmin(context), async (req, res) => {
        try {
            const controller = new EssayThemeController(driver);
            const themes = await controller.listAll(req.query);
            res.status(200).json(themes);
        } catch (error) {
            res.status(500).json(error);
        } finally {
            res.end();
        }
    })
}