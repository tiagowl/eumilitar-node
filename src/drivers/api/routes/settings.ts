import { Router } from "express";
import SettingsController from "../../../adapters/controllers/SettingsController";
import { Permissions } from "../../../entities/User";
import { Context } from "../../interfaces";
import { checkPermission, isAuthenticated } from "./tools";

export default (context: Context) => {
    const controller = new SettingsController(context);
    return Router()
        .put('/settings/', checkPermission(context, ['admin'], [Permissions.UPDATE_SETTINGS]), async (req, res) => {
            try {
                const settings = await controller.updateOrCreate(req.body);
                res.json(settings).status(200);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .get('/settings/', checkPermission(context, ['admin'], [Permissions.UPDATE_SETTINGS]), async (_req, res) => {
            try {
                const settings = await controller.get();
                res.json(settings).status(200);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        });
};