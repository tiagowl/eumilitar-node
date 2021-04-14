import settings from './settings';
import { connect, Application } from './drivers';


function main() {
    const { port, host } = settings.server;
    const database = connect(settings.database);
    const api = new Application(database);
    api.serve(port, host);
}

main()