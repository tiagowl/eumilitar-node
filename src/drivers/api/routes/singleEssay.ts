import { Router } from "express";
import SingleEssayController from "../../../adapters/controllers/SingleEssay";
import { Context } from "../../interfaces";
import { checkPermission } from "./tools";

export default (context: Context) => {
    const controller = new SingleEssayController(context);
    return Router({})
        .post('/single-essays/', checkPermission(context, ['admin']), async (req, res) => {
            try {
                const created = await controller.create(req.body);
                res.status(201).json(created);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        });
};