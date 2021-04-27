import settings from './settings';
import { connect, Application } from './drivers';
import transporter from './drivers/smtp';

export const database = connect(settings.database);
export const api = new Application(database, transporter);
export default api.server