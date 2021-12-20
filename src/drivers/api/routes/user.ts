import { Context } from "../../interfaces";
import { Router } from 'express';
import { checkAuth, checkPermission, isAuthenticated } from "./tools";
import UserController from "../../../adapters/controllers/UserController";
import User, { Permissions } from "../../../entities/User";

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
        .put('/users/profile/', isAuthenticated(context), async (req, res) => {
            try {
                const { body, user } = req;
                if (!user) throw { message: 'Não autorizado', status: 403 };
                const updated = await controller.update(user.id, body, user);
                res.status(200).json(updated);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .get('/users/', checkPermission(context, ['admin']), async (req, res) => {
            try {
                const searchStudents = req.query?.permission === 'student' || !req.query.permission;
                const hasPermission = await controller.hasPermissions((req.user as User).id, [Permissions.SEE_USERS]);
                if (searchStudents && !hasPermission) throw { message: 'Não autorizado', status: 401 };
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
                const created = await controller.create(req.body, req.user as User);
                res.status(201).json(created);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .get('/users/:id/', checkPermission(context, ['admin'], [Permissions.SEE_USERS]), async (req, res) => {
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
                const { params: { id }, body, user } = req;
                if (!user) throw { message: 'Não autorizado', status: 403 };
                const updated = await controller.update(Number(id), body, user);
                res.status(200).json(updated);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .get('/users/charts/sent-essays/', checkPermission(context, ['admin'], [Permissions.SEE_DASHBOARD]), async (req, res) => {
            try {
                const chart = await controller.sentEssaysChart(req.query);
                res.status(200).json(chart);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        });
};