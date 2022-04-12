import { Context } from "../../interfaces";
import { Router } from 'express';
import { checkPermission, isAuthenticated } from "./tools";
import EssayController from "../../../adapters/controllers/EssayController";
import { Permissions } from "../../../entities/User";

export default (context: Context) => {
    const { storage } = context;
    const controller = new EssayController(context);
    return Router({})
        .post('/essays/', isAuthenticated(context), storage.single('file'), async (req, res) => {
            try {
                if (!req.user) throw { message: 'Não autenticado', status: 401 };
                const response = await controller.create({ ...req.body, file: (req.file as Express.MulterS3.File), student: req.user.id }, req.user);
                res.status(201).json(response);
            } catch (error: any) {
                res.status(error.status || 400).json(error);
            } finally {
                res.end();
            }
        })
        .get('/essays/', isAuthenticated(context), async (req, res) => {
            try {
                const { user, query } = req;
                console.log(query);
                if (!user) throw { message: 'Não autenticado', status: 401 };
                const hasPermission = user.permission === 'admin' ? user.permissions.has(Permissions.SEE_ESSAYS) : true;
                if (new Set(['admin', 'corrector']).has(user.permission) && !query.my && hasPermission) {
                    const response = await controller.allEssays(query, user);
                    res.status(200).json(response);
                } else {
                    const response = await controller.myEssays(user, req.query || {});
                    res.status(200).json(response);
                }
            } catch (error: any) {
                res.status(error.status || 400).json(error);
            } finally {
                res.end();
            }
        })
        .get('/essays/:id/', isAuthenticated(context), async (req, res) => {
            try {
                const { id } = req.params;
                if (!req.user) throw { message: 'Não autenticado', status: 401 };
                const response = await controller.get(Number(id), req.user);
                res.status(200).json(response);
            } catch (error: any) {
                res.status(error.status || 400).json(error);
            } finally {
                res.end();
            }
        })
        .post('/essays/:id/corrector/', checkPermission(context, ['admin', 'corrector']), async (req, res) => {
            try {
                const { id } = req.params;
                const { user } = req;
                if (!user) throw { message: 'Não autenticado', status: 401 };
                const response = await controller.partialUpdate(Number(id), { corrector: user?.id, status: 'correcting' }, user);
                res.status(201).json(response);
            } catch (error: any) {
                res.status(error.status || 400).json(error);
            } finally {
                res.end();
            }
        })
        .delete('/essays/:id/corrector/', checkPermission(context, ['admin', 'corrector']), async (req, res) => {
            try {
                const { id } = req.params;
                const { user } = req;
                if (!user) throw { message: 'Não autenticado', status: 401 };
                const response = await controller.cancelCorrecting(Number(id), user?.id as number, user);
                res.status(200).json(response);
            } catch (error: any) {
                res.status(error.status || 400).json(error);
            } finally {
                res.end();
            }
        })
        .get('/essays/charts/sent/', checkPermission(context, ['admin'], [Permissions.SEE_DASHBOARD]), async (req, res) => {
            try {
                const chart = await controller.sentChart(req.query);
                res.status(200).json(chart);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .get('/essays/charts/evaluated/', checkPermission(context, ['admin'], [Permissions.SEE_DASHBOARD]), async (req, res) => {
            try {
                const chart = await controller.evaluatedChart(req.query);
                res.status(200).json(chart);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .get('/essays/charts/avg-correction-time/', checkPermission(context, ['admin'], [Permissions.SEE_DASHBOARD]), async (req, res) => {
            try {
                const chart = await controller.avgTimeCorrection(req.query);
                res.status(200).json(chart);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .put('/essays/:idEssay/:idCorrector/', checkPermission(context, ['admin']), async (req, res) => {
            const {idEssay} = req.params;
            const {idCorrector} = req.params;
            try{
                const update = await controller.updateEssayCorrector(parseInt(idEssay), parseInt(idCorrector));
                res.status(200).json(update);
            }catch(err: any){
                res.status(err.status || 500).json(err);
            }finally{
                res.end();
            }
        })
};