import { Context } from "../../interfaces";
import { Router } from 'express';
import SubscriptionController, { OrderData } from "../../../adapters/controllers/SubscriptionController";
import { checkAuth, checkPermission, isAuthenticated } from "./tools";
import { SubscriptionCreation } from "../../../cases/SubscriptionCase";
import User, { Permissions } from "../../../entities/User";
import UserController from "../../../adapters/controllers/UserController";

export default (context: Context) => {
    const controller = new SubscriptionController(context);
    const users = new UserController(context);
    return Router({})
        .get('/users/profile/subscriptions/', isAuthenticated(context), async (req, res) => {
            try {
                const subscriptions = await controller.mySubscriptions(req.user?.id || 0);
                res.status(200).json(subscriptions);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .get('/user/subscriptions/:id', checkPermission(context, ['admin']), async (req, res) => {
            try {
                const subscriptions = await controller.mySubscriptions(parseInt(req.params.id) || 0);
                res.status(200).json(subscriptions);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .get('/subscriptions/', checkPermission(context, ['admin']), async (req, res) => {
            try {
                const subscriptions = await controller.list(req.query);
                res.status(200).json(subscriptions);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .post('/subscriptions/', async (req, res) => {
            try {
                const user = await checkAuth(req, context, true).catch(error => {
                    if (error.status === 401) return;
                    throw error;
                }) as User;
                if (user && user.permission === 'admin') {
                    if (!await users.hasPermissions(user, [Permissions.UPDATE_STUDENTS])) throw { message: 'Não autorizado', status: 401 };
                    const body = {
                        ...req.body as SubscriptionCreation,
                        expiration: new Date((req.body as SubscriptionCreation).expiration)
                    };
                    const created = await controller.create(body);
                    res.status(201).json(created);
                } else {
                    const body = req.body as OrderData;
                    const created = await controller.createFromHotmart({
                        ...body as OrderData,
                        'prod': Number(body.prod),
                        phone_number: Number(body.phone_number),
                        phone_local_code: Number(body.phone_local_code),
                    });
                    res.status(201).json(created);
                }
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .post('/subscriptions/cancelation/', async (req, res) => {
            try {
                const canceled = await controller.cancel({
                    ...req.body,
                    'prod': Number(req.body.prod),
                });
                res.status(200).json(canceled);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .put('/subscriptions/:id/', checkPermission(context, ['admin'], [Permissions.UPDATE_STUDENTS]), async (req, res) => {
            try {
                const { id } = req.params;
                const subscriptions = await controller.update(Number(id), {
                    ...req.body,
                    expiration: new Date(req.body.expiration),
                });
                res.status(200).json(subscriptions);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .get('/subscriptions/charts/actives/', checkPermission(context, ['admin'], [Permissions.SEE_DASHBOARD]), async (req, res) => {
            try {
                const chart = await controller.activeChart(req.query);
                res.status(200).json(chart);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        });
};