import getContext from '../context';
import settings from '../../settings';
import SubscriptionController from '../../adapters/controllers/SubscriptionController';

const context = getContext(settings);
const controller = new SubscriptionController(context);

controller.sync()
    .catch(context.logger.error);