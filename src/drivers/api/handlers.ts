import { RequestHandler } from "express";
import AuthController, { AuthInterface, AuthResponse } from "../../adapters/controllers/Auth";
import ChangePasswordController, { ChangePasswordInterface, ChangePasswordResponse } from "../../adapters/controllers/ChangePassword";
import CheckPasswordToken, { CheckPasswordInterface, CheckedTokenInterface } from "../../adapters/controllers/CheckPasswordToken";
import PasswordRecoveryController, { PasswordRecoveryInterface, PasswordRecoveryResponse } from "../../adapters/controllers/PasswordRecovery";
import settings from '../../settings';
import { HandlerProps } from "./interfaces";

export function token({ driver }: HandlerProps): RequestHandler<any, AuthResponse, AuthInterface> {
    return async (req, res) => {
        try {
            const controller = new AuthController(req.body, driver);
            const response = await controller.auth(req.get('User-Agent'))
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

export function passwordRecoveries({ driver, smtp }: HandlerProps): RequestHandler<any, PasswordRecoveryResponse, PasswordRecoveryInterface> {
    return async (req, res) => {
        try {
            const controller = new PasswordRecoveryController(req.body, driver, smtp, settings.messageConfig);
            const response = await controller.recover();
            res.status(201).json(response);
        } catch (error) {
            res.status(400).json(error);
        } finally {
            res.end();
        }
    }
}


export function checkChangePasswordToken({ driver }: HandlerProps): RequestHandler<any, CheckedTokenInterface, CheckPasswordInterface> {
    return async (req, res) => {
        try {
            const controller = new CheckPasswordToken(req.params, driver);
            const response = await controller.check();
            res.status(200).json(response);
        } catch (error) {
            res.status(500).json(error);
        } finally {
            res.end();
        }
    }
}

export function changePassword({ driver }: HandlerProps): RequestHandler<any, ChangePasswordResponse, ChangePasswordInterface> {
    return async (req, res) => {
        try {
            const controller = new ChangePasswordController(req.body, driver);
            const response = await controller.updatePassword();
            res.status(200).json(response);
        } catch (error) {
            res.status(400).json(error)
        } finally {
            res.end();
        }
    }
}