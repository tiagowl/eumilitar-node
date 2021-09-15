import { Context } from "../../interfaces";
import { Router } from 'express';
import { checkAuth, checkPermission } from "./tools";
import UserController from "../../../adapters/controllers/User";

export default (context: Context) => {
    const controller = new UserController(context);
    return Router({})
        .get('/users/profile/', async (req, res) => {
            try {
                const user = await checkAuth(req, context);
                res.status(200).json(user);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .get('/users/', checkPermission(context, ['admin']), async (req, res) => {
            try {
                const response = await controller.all(req.query || {});
                res.status(200).json(response);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .post('/users/', checkPermission(context, ['admin']), async (req, res) => {
            try {
                const created = await controller.create(req.body);
                res.status(201).json(created);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .get('/users/:id/', checkPermission(context, ['admin']), async (req, res) => {
            try {
                const { id } = req.params;
                const user = await controller.get(Number(id));
                res.status(200).json(user);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .put('/users/:id/', checkPermission(context, ['admin']), async (req, res) => {
            try {
                const { id } = req.params;
                const updated = await controller.update(Number(id), req.body);
                res.status(200).json(updated);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        });
};