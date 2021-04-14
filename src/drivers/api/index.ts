import express, { Express } from 'express';
import { Knex } from 'knex';
import routes from './routes';
import { Route } from './interfaces';


export default class Application {
    private driver: Knex;
    private server: Express;
    private routes: Route[];

    constructor(driver: Knex) {
        this.driver = driver;
        this.server = express();
        this.routes = routes;
        this.setUpRoutes()
    }

    private setUpRoutes() {
        this.routes.forEach(route => {
            const { path } = route;
            route.handlers.forEach(({ handler, method }) => {
                this.server[method](path, handler(this.driver));
            })
        })
    }

    public serve(port: number, host: string) {
        this.server.listen({ port, host })
    }

}