import express, { Express, RequestHandler } from 'express';
import { Knex } from 'knex';
import routes from './routes';
import { Route } from './interfaces';
import middlewares from './middlewares';

export default class Application {
    private driver: Knex;
    private _server: Express;
    private routes: Route[];
    private middlewares: RequestHandler[];

    constructor(driver: Knex) {
        this.driver = driver;
        this._server = express();
        this.routes = routes;
        this.middlewares = middlewares;
        this.setUpMiddlewares()
        this.setUpRoutes()
    }

    get server() { return this._server; }

    private setUpRoutes() {
        this.routes.forEach(route => {
            const { path } = route;
            route.handlers.forEach(({ handler, method }) => {
                this._server[method](path, handler(this.driver));
            })
        })
    }

    private setUpMiddlewares() {
        this.middlewares.forEach(middleware => {
            this._server.use(middleware);
        })
    }

    public serve(port: number, host: string) {
        this._server.listen({ port, host }, () => {
            // tslint:disable-next-line
            console.info(`RUNNING AT http://${host}:${port}/`)
        })
    }

}