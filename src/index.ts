import settings from './settings';
import createServer from './drivers';

function main() {
    const api = createServer(settings);
    const { port, host } = settings.server;
    api.serve(port, host);
}

main()