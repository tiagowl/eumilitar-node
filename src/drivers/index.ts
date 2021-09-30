import Application from './api';
import { Settings } from './interfaces';
import createContext from './context';

export default function createServer(settings: Settings) {
    const context = createContext(settings);
    return new Application(context);
}