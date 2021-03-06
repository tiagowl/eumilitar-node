import settings from './settings';
import createServer from './drivers';

function main() {
    const api = createServer(settings);
    api.serve();
}

main();