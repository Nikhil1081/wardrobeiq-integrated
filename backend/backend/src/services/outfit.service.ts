import {
  generateOutfitLook,
  replaceOutfitSlotItem,
  shuffleUnlockedOutfitItems,
} from '../tools/outfitTools.js';
import { getWardrobeItems } from '../tools/wardrobeTools.js';
import { getCustomerProfile } from '../tools/customerTools.js';
import { getRecommendationCandidates } from '../tools/catalogueTools.js';
import { getSavedOutfitsCollection, getOutfitHistoryCollection } from '../db/collections.js';
import { Category, Occasion, Season } from '../types/domain.js';
import { OutfitDTO, OutfitItemDTO } from '../types/dto.js';
import { AppError } from '../middleware/errorHandler.js';

export async function generateOutfitService(
  customerId: string,
  occasion: Occasion,
  season: Season = 'all-season',
  budget?: number,
  style?: string,
  lockedItems: OutfitItemDTO[] = []
): Promise<OutfitDTO> {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const wardrobe = await getWardrobeItems(customerId);
  const ownedProductIds = new Set(wardrobe.map((w) => w.productId).filter(Boolean) as string[]);
  const candidates = await getRecommendationCandidates(customer, ownedProductIds, undefined, budget);

  const outfit = generateOutfitLook(
    customerId,
    occasion,
    season,
    wardrobe,
    candidates,
    budget,
    lockedItems
  );

  // Record history
  try {
    const historyCol = getOutfitHistoryCollection();
    await historyCol.insertOne({
      customerId,
      outfitId: outfit.outfitId,
      items: outfit.items,
      occasion,
      season,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Non-blocking
  }

  return outfit;
}

export async function replaceOutfitSlotService(
  customerId: string,
  outfit: OutfitDTO,
  slot: Category,
  preferences?: any
): Promise<{ replacementItem: OutfitItemDTO; updatedOutfit: OutfitDTO }> {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const wardrobe = await getWardrobeItems(customerId);
  const ownedProductIds = new Set(wardrobe.map((w) => w.productId).filter(Boolean) as string[]);
  const candidates = await getRecommendationCandidates(customer, ownedProductIds, slot);

  return replaceOutfitSlotItem(outfit, slot, wardrobe, candidates);
}

export async function shuffleOutfitService(
  customerId: string,
  occasion?: Occasion,
  season: Season = 'all-season',
  budget?: number,
  style?: string,
  lockedItems: OutfitItemDTO[] = [],
  currentOutfit?: OutfitDTO
): Promise<OutfitDTO> {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const wardrobe = await getWardrobeItems(customerId);
  const ownedProductIds = new Set(wardrobe.map((w) => w.productId).filter(Boolean) as string[]);
  const candidates = await getRecommendationCandidates(customer, ownedProductIds, undefined, budget);

  // Use current outfit if provided, otherwise generate a base outfit
  const baseOutfit = currentOutfit || generateOutfitLook(
    customerId,
    occasion || 'casual',
    season,
    wardrobe,
    candidates,
    budget,
    lockedItems
  );

  return shuffleUnlockedOutfitItems(baseOutfit, wardrobe, candidates);
}

export async function getSavedOutfitsService(customerId: string): Promise<OutfitDTO[]> {
  const collection = getSavedOutfitsCollection();
  const saved = await collection.find({ customerId }).sort({ createdAt: -1 }).toArray();

  return saved.map((s) => ({
    outfitId: s.outfitId,
    occasion: s.occasion,
    season: 'all-season',
    items: s.items as OutfitItemDTO[],
    coverage: 100,
    caption: s.caption,
    totalCost: (s.items as OutfitItemDTO[])
      .filter((i) => i.source === 'recommendation')
      .reduce((sum, i) => sum + i.price, 0),
    missingItems: [],
    compatibilityScore: 90,
    createdAt: s.createdAt,
  }));
}

export async function saveOutfitService(
  customerId: string,
  occasion: Occasion,
  items: OutfitItemDTO[],
  caption?: string
): Promise<OutfitDTO> {
  const collection = getSavedOutfitsCollection();
  const outfitId = `saved_outfit_${Date.now()}`;
  const now = new Date().toISOString();

  const doc = {
    customerId,
    outfitId,
    items,
    occasion,
    caption: caption || `Saved ${occasion} look`,
    createdAt: now,
  };

  await collection.insertOne(doc);

  return {
    outfitId,
    occasion,
    season: 'all-season',
    items,
    coverage: 100,
    caption: doc.caption,
    totalCost: items.filter((i) => i.source === 'recommendation').reduce((sum, i) => sum + i.price, 0),
    missingItems: [],
    compatibilityScore: 92,
    createdAt: now,
  };
}

export async function deleteSavedOutfitService(customerId: string, outfitId: string): Promise<boolean> {
  const collection = getSavedOutfitsCollection();
  const res = await collection.deleteOne({ customerId, outfitId });
  return res.deletedCount > 0;
}
