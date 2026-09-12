import { getFeedbackCollection } from '../db/collections.js';
import { FeedbackType } from '../types/domain.js';
import { getCustomerProfile } from '../tools/customerTools.js';
import { getProductById } from '../tools/catalogueTools.js';
import { AppError } from '../middleware/errorHandler.js';

export async function recordFeedbackService(customerId: string, productId: string, type: FeedbackType) {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const product = await getProductById(productId);
  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', `Product with ID ${productId} not found.`);
  }

  const collection = getFeedbackCollection();
  const now = new Date().toISOString();

  await collection.updateOne(
    { customerId, productId },
    {
      $set: { type, createdAt: now },
    },
    { upsert: true }
  );

  return { success: true, customerId, productId, type };
}

export async function getCustomerFeedbackService(customerId: string) {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const collection = getFeedbackCollection();
  const feedbackList = await collection.find({ customerId }).sort({ createdAt: -1 }).toArray();

  return {
    customerId,
    total: feedbackList.length,
    loved: feedbackList.filter((f) => f.type === 'love').map((f) => f.productId),
    notForMe: feedbackList.filter((f) => f.type === 'not_for_me').map((f) => f.productId),
    history: feedbackList,
  };
}
