import { getBrowsingHistoryCollection, getProductsCollection } from '../db/collections.js';
import { BrowsingHistoryDocument, BrowsingEventType, Category } from '../types/domain.js';
import { BrowsingSignalSummary } from './gapTools.js';

export const BROWSING_WEIGHTS: Record<BrowsingEventType, number> = {
  viewed: 1,
  saved: 2,
  added_to_cart: 3,
  abandoned_cart: 2,
  VIEW: 1,
  CLICK: 1.5,
  SEARCH: 2,
  SAVE: 3,
  WISHLIST: 3,
  ADD_TO_WARDROBE: 4,
  REMOVE_FROM_WISHLIST: 1,
};

export async function recordBrowsingEvent(
  customerId: string,
  productId?: string,
  eventType: BrowsingEventType = 'VIEW',
  timestamp?: string
): Promise<BrowsingHistoryDocument> {
  const collection = getBrowsingHistoryCollection();
  const eventTime = timestamp || new Date().toISOString();

  // Find if customer interacted with this product before
  if (productId) {
    const existing = await collection.findOne({ customerId, productId, eventType });
    if (existing) {
      const newCount = (existing.viewCount || 1) + 1;
      await collection.updateOne(
        { customerId, productId, eventType },
        {
          $set: { viewCount: newCount, timestamp: eventTime },
        }
      );
      return { ...existing, viewCount: newCount, timestamp: eventTime };
    }
  }

  const doc: BrowsingHistoryDocument = {
    customerId,
    productId,
    eventType,
    timestamp: eventTime,
    viewCount: 1,
  };
  await collection.insertOne(doc);
  return doc;
}

export async function getCustomerBrowsingHistory(
  customerId: string,
  limit = 50
): Promise<BrowsingHistoryDocument[]> {
  const collection = getBrowsingHistoryCollection();
  return await collection.find({ customerId }).sort({ timestamp: -1 }).limit(limit).toArray();
}

export async function getCustomerBrowsingSignals(customerId: string): Promise<{
  productWeights: Map<string, number>;
  categoryInterest: Record<Category, number>;
  summary: BrowsingSignalSummary;
}> {
  const history = await getCustomerBrowsingHistory(customerId, 100);
  const productsCollection = getProductsCollection();

  const productWeights = new Map<string, number>();
  const categoryInterest: Record<Category, number> = {
    top: 0,
    bottom: 0,
    dress: 0,
    outerwear: 0,
    shoes: 0,
    accessory: 0,
    traditional: 0,
  };

  const productIds = Array.from(new Set(history.map((h) => h.productId).filter(Boolean) as string[]));
  const products = await productsCollection.find({ productId: { $in: productIds } }).toArray();
  const productMap = new Map(products.map((p) => [p.productId, p]));

  const recentViewedSubcategories: string[] = [];

  for (const item of history) {
    if (!item.productId) continue;
    const weight = (BROWSING_WEIGHTS[item.eventType] || 1) * Math.min(3, item.viewCount || 1);
    productWeights.set(item.productId, (productWeights.get(item.productId) || 0) + weight);

    const product = productMap.get(item.productId);
    if (product) {
      if (categoryInterest[product.category] !== undefined) {
        categoryInterest[product.category] += weight;
      }
      if (!recentViewedSubcategories.includes(product.subcategory)) {
        recentViewedSubcategories.push(product.subcategory);
      }
    }
  }

  return {
    productWeights,
    categoryInterest,
    summary: {
      categoryInterest,
      recentViewedSubcategories: recentViewedSubcategories.slice(0, 5),
    },
  };
}
