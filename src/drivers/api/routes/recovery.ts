import { Context } from "../../interfaces";
import { Router } from 'express';
import RecoveryController, { CheckInterface } from "../../../adapters/controllers/RecoveryController";

export default (context: Context) => {
    const controller = new RecoveryController(context);
    return Router({})
        .post('/password-recoveries/', async (req, res) => {
            try {
                const response = await controller.recover(req.body);
                res.status(201).json(response);
            } catch (error: any) {
                res.status(error.status || 400).json(error);
            } finally {
                res.end();
            }
        })
        .get<CheckInterface>('/password-recoveries/:token/', async (req, res) => {
            try {
                const response = await controller.check(req.params);
                res.status(200).json(response);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .put('/users/profile/password/', async (req, res) => {
            try {
                const response = await controller.updatePassword(req.body);
                res.status(200).json(response);
            } catch (error: any) {
                res.status(error.status || 400).json(error);
            } finally {
                res.end();
            }
        })
        .post('/password-recoveries/checks/', async (req, res) => {
            try {
                const response = await controller.checkShortToken(req.body);
                res.status(201).json(response);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .post('/password-recoveries/direct/', async (req, res)=>{
            try{
                const response = await controller.recoveryDirectToken(req.body);
                res.status(200).json({token: response});
            } catch(error: any){
                res.status(error.status || 400).json(error);
            } finally{
                res.end();
            }
        })
};