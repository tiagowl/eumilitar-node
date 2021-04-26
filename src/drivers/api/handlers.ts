import { RequestHandler } from "express";
import { Knex } from "knex";
import AuthController, { AuthInterface, AuthResponse } from "../../adapters/controllers/Auth";
import PasswordRecoveryController, { PasswordRecoveryInterface, PasswordRecoveryResponse } from "../../adapters/controllers/PasswordRecovery";
import settings from '../../settings';
import transporter from "../smtp";

export function token(driver: Knex): RequestHandler<any, AuthResponse, AuthInterface> {
    return async (req, res) => {
        try {
            const controller = new AuthController(req.body, driver);
            const response = await controller.auth(req.get('User-Agent'))
            res.status(!!response.token ? 201 : 400)
            res.json(response);
        } catch (error) {
            res.status(400)
            res.json(error)
        }finally {
            res.end()
        }
    }
}

export function passwordRecoveries(driver: Knex): RequestHandler<any, PasswordRecoveryResponse, PasswordRecoveryInterface> {
    return async (req, res) => {
        try {
            const controller = new PasswordRecoveryController(req.body, driver, transporter, settings.messageConfig);
            const response = await controller.recover();
            res.status(201).json(response);
        } catch (error) {
            res.status(400).json(error);
        }finally {
            res.end();
        }
    }
}