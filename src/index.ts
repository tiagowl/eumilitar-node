import { api } from './app';
import settings from './settings';

function main() {
    const { port, host } = settings.server;
    api.serve(port, host);
}

main()