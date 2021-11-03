import { Router } from "express";
import WarningController from "../../../adapters/controllers/Warning";
import { Context } from "../../interfaces";
import { checkPermission } from "./tools";

export default (context: Context) => {
    const controller = new WarningController(context);
    return Router({})
        .post('/warning/', checkPermission(context, ['admin']), async (req, res) => {
            try {
                const created = await controller.createOrUpdate(req.body);
                res.json(created).status(201);
            } catch (error: any) {
                res.json(error).status(error.status);
            } finally {
                res.end();
            }
        });
};