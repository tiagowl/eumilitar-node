import { Context } from "../../interfaces";
import { Router } from 'express';
import { checkPermission, isAuthenticated } from "./tools";
import CorrectionController from "../../../adapters/controllers/Correction";

export default (context: Context) => {
    const controller = new CorrectionController(context);
    return Router({})
        .post('/essays/:id/correction/', checkPermission(context, ['admin', 'corrector']), async (req, res) => {
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
        .get('/essays/:id/correction/', isAuthenticated(context), async (req, res) => {
            try {
                const { id } = req.params;
                const response = await controller.get({ essay: Number(id) });
                res.status(200).json(response);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .patch('/essays/:id/correction/', checkPermission(context, ['admin', 'corrector']), async (req, res) => {
            try {
                const { id } = req.params;
                const { user } = req;
                const response = await controller.update(Number(id), Number(user?.id), req.body);
                res.status(200).json(response);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        });
};