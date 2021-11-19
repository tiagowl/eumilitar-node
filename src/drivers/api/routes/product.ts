import { Context } from "../../interfaces";
import { Router } from 'express';
import { checkPermission } from "./tools";
import ProductController from "../../../adapters/controllers/ProductsController";

export default (context: Context) => {
    const controller = new ProductController(context);
    return Router({})
        .post('/products/', checkPermission(context, ['admin']), async (req, res) => {
            try {
                const created = await controller.create(req.body);
                res.status(201).json(created);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .get('/products/', checkPermission(context, ['admin']), async (_req, res) => {
            try {
                const products = await controller.list();
                res.status(200).json(products);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        })
        .put('/products/:id/', checkPermission(context, ['admin']), async (req, res) => {
            try {
                const { id } = req.params;
                const product = await controller.fullUpdate(Number(id), req.body);
                res.status(200).json(product);
            } catch (error: any) {
                res.status(error.status || 500).json(error);
            } finally {
                res.end();
            }
        });
};