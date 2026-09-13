import { getPurchasesCollection } from '../db/collections.js';
import { PurchaseDocument, Category } from '../types/domain.js';

export interface CustomerPurchaseSignals {
  totalPurchases: number;
  averagePrice: number;
  preferredStores: string[];
  categoryFrequency: Record<Category, number>;
  recentPurchases: PurchaseDocument[];
  brandAffinity: Record<string, number>;
}

export async function getCustomerPurchases(
  customerId: string,
  limit = 100
): Promise<PurchaseDocument[]> {
  const collection = getPurchasesCollection();
  return await collection
    .find({ customerId })
    .sort({ purchaseDate: -1 })
    .limit(limit)
    .toArray();
}

export async function getCustomerPurchaseSignals(customerId: string): Promise<CustomerPurchaseSignals> {
  const purchases = await getCustomerPurchases(customerId, 100);

  const categoryFrequency: Record<Category, number> = {
    top: 0,
    bottom: 0,
    dress: 0,
    outerwear: 0,
    shoes: 0,
    accessory: 0,
    traditional: 0,
  };

  const storeCounts: Record<string, number> = {};
  let totalPrice = 0;
  let completedCount = 0;

  for (const p of purchases) {
    if (p.status === 'completed') {
      completedCount++;
      totalPrice += p.pricePaid || p.price;

      if (categoryFrequency[p.category] !== undefined) {
        categoryFrequency[p.category]++;
      }

      if (p.store) {
        storeCounts[p.store] = (storeCounts[p.store] || 0) + 1;
      }
    }
  }

  const averagePrice = completedCount > 0 ? Math.round(totalPrice / completedCount) : 2500;
  const preferredStores = Object.entries(storeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([store]) => store);

  return {
    totalPurchases: purchases.length,
    averagePrice,
    preferredStores,
    categoryFrequency,
    recentPurchases: purchases.slice(0, 5),
    brandAffinity: storeCounts,
  };
}
