import express, { Express, RequestHandler } from 'express';
import { Knex } from 'knex';
import routes from './routes';
import { Context, Route } from './interfaces';
import getMiddlewares from './middlewares';
import Mail from 'nodemailer/lib/mailer';


export default class Application {
    private driver: Knex;
    private _server: Express;
    private routes: Route[];
    private middlewares: RequestHandler[];
    private smtp: Mail;
    private props: Context;

    constructor(driver: Knex, smtp: Mail) {
        this.driver = driver;
        this._server = express();
        this.routes = routes;
        this.smtp = smtp;
        this.props = {
            driver: this.driver,
            smtp: this.smtp,
        }
        this.middlewares = getMiddlewares(this.props);
        this.setUpMiddlewares()
        this.setUpRoutes()
    }

    get server() { return this._server; }

    private setUpRoutes() {
        this.routes.forEach(route => {
            const { path } = route;
            route.handlers.forEach(({ handler, method }) => {
                this._server[method](path, handler(this.props));
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