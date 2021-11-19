import getContext from '../context';
import settings from '../../settings';
import SubscriptionController from '../../adapters/controllers/SubscriptionController';

const context = getContext(settings);
const controller = new SubscriptionController(context);

controller.sync()
    .then(response => {
        context.logger.info(`Synced ${response.length} items`);
    })
    .catch(error => {
        context.logger.error(error);
    });