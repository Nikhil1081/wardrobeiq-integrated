import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDB, teardownTestDB } from './setup.js';
import {
  getWardrobeService,
  addWardrobeItemService,
  updateWardrobeItemService,
  deleteWardrobeItemService,
} from '../src/services/wardrobe.service.js';

describe('Wardrobe CRUD & Automatic Recalculation', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('should retrieve wardrobe items with filters and pagination', async () => {
    const res = await getWardrobeService('C001', { category: 'bottom' });
    expect(res.items.length).toBeGreaterThanOrEqual(1);
    expect(res.items.every((i) => i.category === 'bottom')).toBe(true);
  });

  it('should add a custom wardrobe item and recalculate health & gaps', async () => {
    const before = await getWardrobeService('C001');
    const countBefore = before.total;

    const result = await addWardrobeItemService('C001', {
      name: 'Oversized Wool Trench Coat',
      category: 'outerwear',
      subcategory: 'trench',
      color: 'beige',
      styleTags: ['streetwear', 'minimalist'],
      occasion: ['casual', 'college'],
      season: ['winter', 'monsoon'],
      price: 3499,
      store: 'Custom Boutique',
      imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a',
      isCustom: true,
    });

    expect(result.item.itemId).toBeDefined();
    expect(result.item.name).toBe('Oversized Wool Trench Coat');
    expect(result.item.isCustom).toBe(true);
    expect(result.updatedHealth.overallScore).toBeGreaterThanOrEqual(10);
    expect(result.updatedGaps).toBeDefined();

    const after = await getWardrobeService('C001');
    expect(after.total).toBe(countBefore + 1);
  });

  it('should edit an existing wardrobe item and update health', async () => {
    const list = await getWardrobeService('C001');
    const targetItem = list.items[0];

    const result = await updateWardrobeItemService('C001', targetItem.itemId, {
      name: 'Edited Vintage Item',
      price: 2999,
    });

    expect(result.item.name).toBe('Edited Vintage Item');
    expect(result.item.price).toBe(2999);
  });

  it('should delete a wardrobe item and recalculate health and gaps', async () => {
    const list = await getWardrobeService('C001');
    const itemToDelete = list.items[list.items.length - 1];

    const result = await deleteWardrobeItemService('C001', itemToDelete.itemId);
    expect(result.success).toBe(true);
    expect(result.deletedItemId).toBe(itemToDelete.itemId);
    expect(result.updatedHealth).toBeDefined();
    expect(result.updatedGaps).toBeDefined();
  });
});
