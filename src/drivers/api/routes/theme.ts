import { Context } from "../../interfaces";
import { Router } from 'express';
import { checkPermission, isAuthenticated } from "./tools";
import EssayThemeController from "../../../adapters/controllers/EssayTheme";

export default (context: Context) => {
    const { storage } = context;
    const controller = new EssayThemeController(context);
    return Router({})
        .post('/themes/',
            checkPermission(context, ['admin']),
            storage.single('themeFile'),
            async (req, res) => {
                try {
                    const data = JSON.parse(req.body.data);
                    const response = await controller.create({
                        ...data,
                        startDate: new Date(data.startDate),
                        endDate: new Date(data.endDate),
                        file: req.file
                    });
                    res.status(201).json(response);
                } catch (error: any) {
                    res.status(error.status || 400).send(error);
                } finally {
                    res.end();
                }
            })
        .get('/themes/', isAuthenticated(context), async (req, res) => {
            try {
                const themes = await controller.listAll(req.query);
                res.status(200).json(themes);
            } catch (error: any) {
                res.status(500).json(error);
            } finally {
                res.end();
            }
        })
        .put('/themes/:id/',
            checkPermission(context, ['admin']),
            storage.single('themeFile'),
            async (req, res) => {
                try {
                    const { id } = req.params;
                    const data = JSON.parse(req.body.data);
                    const response = await controller.update(Number(id), {
                        ...data,
                        startDate: new Date(data.startDate),
                        endDate: new Date(data.endDate),
                        file: req.file
                    });
                    res.status(200).json(response);
                } catch (error: any) {
                    res.status(error.status || 400).send(error);
                } finally {
                    res.end();
                }
            })
        .delete('/themes/:id/', checkPermission(context, ['admin']), async (req, res) => {
            try {
                const theme = await controller.deactivate(Number(req.params.id));
                res.status(200).json(theme);
            } catch (error: any) {
                res.status(error.status || 400).json(error);
            } finally {
                res.end();
            }
        });
};