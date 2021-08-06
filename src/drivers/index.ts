import Application from './api';
import createContext from './context';
import { Settings } from './interfaces';

export default function createServer(settings: Settings) {
    const context = createContext(settings);
    return new Application(context);
}