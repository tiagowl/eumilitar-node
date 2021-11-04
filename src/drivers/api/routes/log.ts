import { Router } from "express";
import LogController from "../../../adapters/controllers/Log";
import { Context } from "../../interfaces";

export default (context: Context) => {
    const controller = new LogController(context);
    return Router({})
        .post('/logs/', async (req, res) => {
            try {
                const created = await controller.create({
                    ...req.body,
                    user: req.user?.id,
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