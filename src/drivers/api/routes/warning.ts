import { Router } from "express";
import WarningController from "../../../adapters/controllers/WarningController";
import { Context } from "../../interfaces";
import { checkPermission, isAuthenticated } from "./tools";

export default (context: Context) => {
    const controller = new WarningController(context);
    const { storage } = context;
    return Router({})
        .post('/warning/', storage.single('image'), checkPermission(context, ['admin']), async (req, res) => {
            try {
                const created = await controller.createOrUpdate({
                    ...req.body,
                    image: req.file,
                });
                res.json(created).status(201);
            } catch (error: any) {
                res.json(error).status(error.status || 500);
            } finally {
                res.end();
            }
        })
        .get('/warning/', checkPermission(context, ['admin', 'student']), async (_req, res) => {
            try {
                const warning = await controller.get();
                res.json(warning).status(200);
            } catch (error: any) {
                res.json(error).status(error.status || 500);
            } finally {
                res.end();
            }
        });
};