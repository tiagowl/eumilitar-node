import getContext from '../context';
import settings from '../../settings';
import SubscriptionController from '../../adapters/controllers/Subscription';

const context = getContext(settings);
const controller = new SubscriptionController(context);

controller.sync().then(response => {
    context.logger.info(`Synced ${response.length} items`);
});