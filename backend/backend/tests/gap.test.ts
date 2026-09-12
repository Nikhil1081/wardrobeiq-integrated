import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDB, teardownTestDB } from './setup.js';
import { getCustomerGapsService, getGapDetailService } from '../src/services/gap.service.js';

describe('Wardrobe Gap Detection Engine', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('should detect category gap for customer with 0 outerwear (C001)', async () => {
    const gaps = await getCustomerGapsService('C001');
    expect(gaps.length).toBeGreaterThanOrEqual(1);

    const outerwearGap = gaps.find((g) => g.category === 'outerwear');
    expect(outerwearGap).toBeDefined();
    expect(outerwearGap?.priority).toMatch(/very_high|high/);
    expect(outerwearGap?.priorityScore).toBeGreaterThanOrEqual(60);
    expect(outerwearGap?.outfitsUnlocked).toBeGreaterThan(0);
  });

  it('should detect color redundancy gap for customer with low diversity (C002)', async () => {
    const gaps = await getCustomerGapsService('C002');
    const redundancyGap = gaps.find((g) => g.gapType === 'color_redundancy');
    expect(redundancyGap).toBeDefined();
    expect(redundancyGap?.reason).toContain('heavily concentrated');
  });

  it('should return complete gap detail with compatible products for Gap Detail Drawer', async () => {
    const gaps = await getCustomerGapsService('C001');
    const firstGap = gaps[0];

    const detail = await getGapDetailService('C001', firstGap.gapId);
    expect(detail.gap.gapId).toBe(firstGap.gapId);
    expect(detail.reason).toBeDefined();
    expect(detail.compatibleProducts.length).toBeGreaterThan(0);
    expect(detail.recommendedBudgetRange.min).toBeGreaterThan(0);
    expect(detail.recommendedBudgetRange.max).toBeGreaterThan(detail.recommendedBudgetRange.min);
  });
});
