import {
  recordBrowsingEvent,
  getCustomerBrowsingHistory,
  getCustomerBrowsingSignals,
} from '../tools/browsingTools.js';
import { getCustomerProfile } from '../tools/customerTools.js';
import { BrowsingEventType } from '../types/domain.js';
import { AppError } from '../middleware/errorHandler.js';

export async function recordBrowsingEventService(
  customerId: string,
  productId: string,
  eventType: BrowsingEventType,
  timestamp?: string
) {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  return await recordBrowsingEvent(customerId, productId, eventType, timestamp);
}

export async function getCustomerBrowsingService(customerId: string) {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const history = await getCustomerBrowsingHistory(customerId, 50);
  const signals = await getCustomerBrowsingSignals(customerId);

  return {
    customerId,
    totalEvents: history.length,
    recentEvents: history,
    categoryInterest: signals.categoryInterest,
  };
}
