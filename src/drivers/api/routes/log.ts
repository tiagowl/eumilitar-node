import { Router } from "express";
import LogController from "../../../adapters/controllers/Log";
import { Context } from "../../interfaces";
import { checkAuth, checkPermission } from "./tools";

export default (context: Context) => {
    const controller = new LogController(context);
    return Router({})
        .get('/logs/', checkPermission(context, ['admin']), async (req, res) => {
            try {
                const list = await controller.filter(req.query);
                res.status(200).json(list);
            } catch (error: any) {
                res.json(error).status(error.status || 500);
            } finally {
                res.end();
            }
        })
        .post('/logs/', async (req, res) => {
            try {
                const user = await checkAuth(req, context).catch(() => undefined);
                const created = await controller.create({
                    ...req.body,
                    user: user?.id,
                    ip: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress),
                    userAgent: req.get('User-Agent'),
                });
                res.status(201).json(created);
            } catch (error: any) {
                res.json(error).status(error.status || 500);
            } finally {
                res.end();
            }
        });
};