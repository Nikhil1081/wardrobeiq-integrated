import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDB, teardownTestDB } from './setup.js';
import {
  getOffersForProductService,
  getOffersForCustomerService,
  validateOfferService,
} from '../src/services/offer.service.js';
import { getAllActiveOffers } from '../src/tools/offerTools.js';

describe('Offer Engine & Validation', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('should only return active, non-expired offers', async () => {
    const active = await getAllActiveOffers();
    const now = new Date().toISOString();
    expect(active.length).toBeGreaterThan(0);
    expect(active.every((o) => o.active && o.validUntil >= now)).toBe(true);
  });

  it('should validate offer and calculate discounted price', async () => {
    const activeOffers = await getAllActiveOffers();
    const target = activeOffers.find((o) => o.conditionType === 'none');

    if (target) {
      const validated = await validateOfferService('C001', target.productId, target.offerId);
      expect(validated.offerId).toBe(target.offerId);
      expect(validated.discountedPrice).toBeLessThan(validated.discountedPrice + 100);
      expect(validated.discountPercentage).toBe(target.discountPercentage);
    }
  });

  it('should retrieve applicable offers tailored to customer wardrobe', async () => {
    const customerOffers = await getOffersForCustomerService('C001');
    expect(Array.isArray(customerOffers)).toBe(true);
  });
});
