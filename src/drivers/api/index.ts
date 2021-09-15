import express, { Express, RequestHandler } from 'express';
import { Context } from '../interfaces';
import getMiddlewares from './middlewares';
import getRouter from './routes';

export default class Application {
    private readonly _server: Express;
    private readonly middlewares: RequestHandler[];
    private readonly context: Context;

    constructor(context: Context) {
        this._server = express();
        this.context = context;
        this.middlewares = getMiddlewares(this.context);
        this.setUpMiddlewares();
        this.setUpRoutes();
    }

    get server() { return this._server; }

    private setUpRoutes() {
        const router = getRouter(this.context);
        this._server.use(router);
    }

    private setUpMiddlewares() {
        this.middlewares.forEach(middleware => {
            this._server.use(middleware);
        });
    }

    public serve() {
        const { server: { port, host } } = this.context.settings;
        this._server.listen({ port, host }, () => {
            this.context.logger.info(`RUNNING AT http://${host}:${port}/`);
        });
    }

}