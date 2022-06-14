import { Context } from "../../interfaces";
import { Router } from 'express';
import { checkAuth, checkPermission, isAuthenticated } from "./tools";
import UserController from "../../../adapters/controllers/UserController";
import User, { Permissions } from "../../../entities/User";

export default (context: Context) => {
    const controller = new UserController(context);
    const {storage} = context;
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
        .put('/users/profile/', isAuthenticated(context), storage.single('file'), async (req, res) => {
            try {
                const { body, user, file } = req;
                if (!user) throw { message: 'Não autorizado', status: 403 };
                const updated = await controller.update(user.id, {...body, file}, user);
                res.status(200).json(updated);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .get('/users/', checkPermission(context, ['admin', 'corrector'], [Permissions.SEE_USERS]), async (req, res) => {
            try {
                const searchStudents = req.query?.permission === 'student' || !req.query.permission;
                if(req.query.search != "5"){    
                    const hasPermission = await controller.hasPermissions(req.user as User, [Permissions.SEE_USERS]);
                    if (searchStudents && !hasPermission) throw { message: 'Não autorizado', status: 401 };
                }
                const response = await controller.all(req.query || {});
                res.status(200).json(response);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .post('/users/', checkPermission(context, ['admin'], [Permissions.CREATE_USERS]), async (req, res) => {
            try {
                console.log(`Email rota: ${req.body.email}`);
                const created = await controller.create(req.body, req.user as User);
                res.status(201).json(created);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .get('/users/sent-essays/', checkPermission(context, ['admin'], [Permissions.SEE_DASHBOARD]), async (req, res) => {
            try {
                const buffer = await controller.countEssaySentByUser(req.query);
                res.setHeader('Content-Disposition', 'attachment; filename="sent-essays.csv');
                res.status(200).contentType('text/csv; charset=utf-8');
                res.end(buffer, 'binary');
            } catch (error: any) {
                res.json(error).status(error.status || 500);
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
        .put('/users/:id/', checkPermission(context, ['admin'], [Permissions.UPDATE_STUDENTS]), async (req, res) => {
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
        })
        .post('/users/resendEmail', checkPermission(context, ['admin']), async (req, res) => {
            try{
                await controller.reSendMail(req.body);
                res.status(200).json({message: "Email enviado!"});
            }catch(err){
                res.status(500).json({message: "erro ao enviar email"});
            }
        })
        .get('/users/sends/:id', isAuthenticated(context), async (req, res) => {
            try{
                const sends = await controller.getUserSends(parseInt(req.params.id));
                res.status(200).json(sends);
            }catch(err){
                res.status(500).json({message: "Usuário não encontrado"});
            }
        })
};