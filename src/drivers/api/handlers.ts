import { RequestHandler } from "express";
import { Knex } from "knex";
import AuthController, { AuthInterface, AuthResponse } from "../../adapters/controllers/Auth";
import settings from '../../settings';

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