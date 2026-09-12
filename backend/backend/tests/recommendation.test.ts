import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDB, teardownTestDB } from './setup.js';
import {
  getPersonalizedRecommendationsService,
  getWhyThisExplanationService,
} from '../src/services/recommendation.service.js';
import { getWardrobeItems } from '../src/tools/wardrobeTools.js';

describe('Authoritative Recommendation Engine & Scoring', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('should generate recommendations exposing the exact 6-factor score breakdown', async () => {
    const res = await getPersonalizedRecommendationsService('C001');
    expect(res.recommendations.length).toBeGreaterThan(0);

    const first = res.recommendations[0];
    expect(first.scoreBreakdown).toBeDefined();
    expect(first.scoreBreakdown.gapRelevance).toBeLessThanOrEqual(30);
    expect(first.scoreBreakdown.styleCompatibility).toBeLessThanOrEqual(20);
    expect(first.scoreBreakdown.colorCompatibility).toBeLessThanOrEqual(15);
    expect(first.scoreBreakdown.occasionCompatibility).toBeLessThanOrEqual(15);
    expect(first.scoreBreakdown.budgetCompatibility).toBeLessThanOrEqual(10);
    expect(first.scoreBreakdown.seasonCompatibility).toBeLessThanOrEqual(10);
    expect(first.scoreBreakdown.browsingBoost).toBeGreaterThanOrEqual(0);
    expect(first.scoreBreakdown.duplicatePenalty).toBeLessThanOrEqual(0);
  });

  it('should NEVER recommend products already owned in customer wardrobe', async () => {
    const wardrobe = await getWardrobeItems('C001');
    const ownedProductIds = new Set(wardrobe.map((w) => w.productId).filter(Boolean));

    const res = await getPersonalizedRecommendationsService('C001');
    for (const rec of res.recommendations) {
      expect(ownedProductIds.has(rec.productId)).toBe(false);
    }
  });

  it('should suppress products matching avoided colors', async () => {
    // C001 avoids 'neon' and 'pink'
    const res = await getPersonalizedRecommendationsService('C001');
    for (const rec of res.recommendations) {
      expect(rec.color.toLowerCase()).not.toBe('neon');
      expect(rec.color.toLowerCase()).not.toBe('pink');
    }
  });

  it('should generate grounded Why This explanations', async () => {
    const res = await getPersonalizedRecommendationsService('C001');
    const topRec = res.recommendations[0];

    const explanation = await getWhyThisExplanationService('C001', topRec.productId);
    expect(explanation.productId).toBe(topRec.productId);
    expect(explanation.styleReason).toBeDefined();
    expect(explanation.scoreBreakdown).toBeDefined();
    expect(explanation.wardrobeCompatibility).toBeDefined();
  });
});
