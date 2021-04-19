import settings from './settings';
import { connect, Application } from './drivers';

export const database = connect(settings.database);
export const api = new Application(database);
export default api.server