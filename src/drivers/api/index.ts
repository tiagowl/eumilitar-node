import express, { Express, RequestHandler } from 'express';
import routes from './routes';
import { Context, Route } from '../interfaces';
import getMiddlewares from './middlewares';


export default class Application {
    private readonly _server: Express;
    private readonly routes: Route[];
    private readonly middlewares: RequestHandler[];
    private readonly context: Context;

    constructor(context: Context) {
        this._server = express();
        this.routes = routes;
        this.context = context;
        this.middlewares = getMiddlewares(this.context);
        this.setUpMiddlewares();
        this.setUpRoutes();
    }

    get server() { return this._server; }

    private setUpRoutes() {
        this.routes.forEach(route => {
            const { path } = route;
            route.handlers.forEach(({ handler, method }) => {
                this._server[method](path, handler(this.context));
            });
        });
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