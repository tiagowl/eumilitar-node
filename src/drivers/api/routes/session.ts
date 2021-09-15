import { Context } from "../../interfaces";
import { Router } from 'express';
import SessionController from "../../../adapters/controllers/Session";
import { checkAuth, getToken } from "./tools";

export default (context: Context) => {
    const controller = new SessionController(context);
    return Router({})
        .post('/tokens/', async (req, res) => {
            try {
                const response = await controller.auth({
                    ...req.body,
                    agent: req.get('User-Agent')
                });
                res.status(201).json(response);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .delete('/tokens/', async (req, res) => {
            try {
                await checkAuth(req, context);
                const token = await getToken(req.headers.authorization);
                await controller.delete(token);
                res.status(204);
            } catch (error: any) {
                res.status(error.status || 400).json(error);
            } finally {
                res.end();
            }
        });
};