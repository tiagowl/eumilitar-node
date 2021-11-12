import { Router } from "express";
import ReviewController from "../../../adapters/controllers/ReviewController";
import { Context } from "../../interfaces";
import { isAuthenticated } from "./tools";

export default (context: Context) => {
    const controller = new ReviewController(context);
    return Router()
        .get('/can-review/', isAuthenticated(context), async (req, res) => {
            try {
                if (!req.user) throw { message: 'Não autorizado', status: 401 };
                const can = await controller.canReview(req.user?.id);
                res.status(200).json(can);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .post('/reviews/', isAuthenticated(context), async (req, res) => {
            try {
                if (!req.user) throw { message: 'Não autorizado', status: 401 };
                const created = await controller.create({
                    ...req.body,
                    user: req.user.id,
                });
                res.status(201).json(created);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        });
};