import { Router } from "express";
import SingleEssayController from "../../../adapters/controllers/SingleEssay";
import { Context } from "../../interfaces";
import { checkPermission, isAuthenticated } from "./tools";

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
        })
        .get('/single-essays/:token/', isAuthenticated(context), async (req, res) => {
            try {
                const { user } = req;
                if (!user) throw { message: 'Não autorizado', status: 401 };
                const checked = await controller.check({ student: user.id, token: req.params.token });
                res.json(checked).status(200);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        });
};