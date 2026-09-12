import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDB, teardownTestDB } from './setup.js';
import {
  generateOutfitService,
  replaceOutfitSlotService,
  shuffleOutfitService,
  saveOutfitService,
  getSavedOutfitsService,
  deleteSavedOutfitService,
} from '../src/services/outfit.service.js';

describe('Outfit Builder & Actions', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('should generate complete coordinated outfit distinguishing YOUR CLOSET and AI PICK', async () => {
    const outfit = await generateOutfitService('C001', 'casual', 'winter', 3000);
    expect(outfit.outfitId).toBeDefined();
    expect(outfit.items.length).toBeGreaterThanOrEqual(3);

    const sources = outfit.items.map((i) => i.source);
    expect(sources).toContain('wardrobe');
  });

  it('should replace an individual outfit slot', async () => {
    const outfit = await generateOutfitService('C001', 'casual', 'winter', 3000);
    const targetSlot = outfit.items[0].slot;

    const result = await replaceOutfitSlotService('C001', outfit, targetSlot);
    expect(result.replacementItem).toBeDefined();
    expect(result.replacementItem.slot).toBe(targetSlot);
    expect(result.updatedOutfit.items.length).toBe(outfit.items.length);
  });

  it('should shuffle outfit while strictly preserving locked items', async () => {
    const outfit = await generateOutfitService('C001', 'casual', 'winter', 3000);
    const lockedItem = { ...outfit.items[0], locked: true };
    const outfitWithLock = {
      ...outfit,
      items: [lockedItem, ...outfit.items.slice(1)],
    };

    const shuffled = await shuffleOutfitService('C001', 'casual', 'winter', 3000, undefined, [lockedItem]);
    const shuffledLockedItem = shuffled.items.find((i) => i.slot === lockedItem.slot);
    expect(shuffledLockedItem?.itemId).toBe(lockedItem.itemId);
  });

  it('should save and delete outfits', async () => {
    const outfit = await generateOutfitService('C001', 'college', 'all-season');
    const saved = await saveOutfitService('C001', 'college', outfit.items, 'My College Ensemble');
    expect(saved.outfitId).toBeDefined();

    const list = await getSavedOutfitsService('C001');
    expect(list.some((s) => s.outfitId === saved.outfitId)).toBe(true);

    const deleted = await deleteSavedOutfitService('C001', saved.outfitId);
    expect(deleted).toBe(true);
  });
});
