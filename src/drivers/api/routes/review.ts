import { Router } from "express";
import ReviewController from "../../../adapters/controllers/ReviewController";
import { Permissions } from "../../../entities/User";
import { Context } from "../../interfaces";
import { checkPermission, isAuthenticated } from "./tools";

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
        })
        .get('/reviews/charts/result/', checkPermission(context, ['admin'], [Permissions.SEE_DASHBOARD]), async (req, res) => {
            try {
                const chart = await controller.resultChart(req.query);
                res.json(chart).status(200);
            } catch (error: any) {
                res.json(error).status(error.status || 500);
            } finally {
                res.end();
            }
        })
        .get('/reviews/score/', checkPermission(context, ['admin'], [Permissions.SEE_DASHBOARD]), async (req, res) => {
            try {
                const score = await controller.score(req.query);
                res.json(score).status(200);
            } catch (error: any) {
                res.json(error).status(error.status || 500);
            } finally {
                res.end();
            }
        })
        .get('/reviews/', checkPermission(context, ['admin'], [Permissions.SEE_DASHBOARD]), async (req, res) => {
            try {
                const buffer = await controller.listAsXLXS(req.query);
                res.setHeader('Content-Disposition', 'attachment; filename="reviews.csv');
                res.status(200).contentType('text/csv; charset=utf-8');
                res.end(buffer, 'binary');
            } catch (error: any) {
                res.json(error).status(error.status || 500);
            } finally {
                res.end();
            }
        });
};