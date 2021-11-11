import { Context } from "../../interfaces";
import { Router } from 'express';
import EssayInvalidationController from "../../../adapters/controllers/EssayInvalidationController";
import { checkPermission, isAuthenticated } from "./tools";

export default (context: Context) => {
    const controller = new EssayInvalidationController(context);
    return Router({})
        .post('/essays/:id/invalidation/', checkPermission(context, ['admin', 'corrector']), async (req, res) => {
            try {
                const { id } = req.params;
                const { user } = req;
                const response = await controller.create({ ...req.body, essay: Number(id), corrector: Number(user?.id) });
                res.status(201).json(response);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .get('/essays/:id/invalidation/', isAuthenticated(context), async (req, res) => {
            try {
                const { id } = req.params;
                const response = await controller.get(Number(id));
                res.status(200).json(response);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        });
};