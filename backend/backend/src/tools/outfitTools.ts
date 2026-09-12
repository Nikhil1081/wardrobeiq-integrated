import { WardrobeDocument, ProductDocument, Category, Occasion, Season } from '../types/domain.js';
import { OutfitDTO, OutfitItemDTO } from '../types/dto.js';

export function generateOutfitLook(
  customerId: string,
  occasion: Occasion,
  season: Season = 'all-season',
  wardrobeItems: WardrobeDocument[],
  recommendedCandidates: ProductDocument[],
  budget?: number,
  lockedItems: OutfitItemDTO[] = []
): OutfitDTO {
  const outfitId = `outfit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const lockedSlots = new Map<Category, OutfitItemDTO>();
  for (const item of lockedItems) {
    if (item.locked) {
      lockedSlots.set(item.slot, item);
    }
  }

  // Determine outfit structure:
  // Option A: Top + Bottom + Shoes + Outerwear (or Accessory)
  // Option B: Dress + Shoes + Outerwear (or Accessory)
  const slotsNeeded: Category[] = ['top', 'bottom', 'shoes', 'outerwear'];

  const selectedItems: OutfitItemDTO[] = [];
  const missingItems: Category[] = [];
  let totalCost = 0;

  for (const slot of slotsNeeded) {
    if (lockedSlots.has(slot)) {
      selectedItems.push(lockedSlots.get(slot)!);
      continue;
    }

    // Step 1: Look in customer's owned wardrobe first
    const ownedMatches = wardrobeItems.filter((w) => {
      if (w.category !== slot) return false;
      if (Array.isArray(w.occasion) && !w.occasion.includes(occasion) && !w.occasion.includes('casual')) {
        return false;
      }
      return true;
    });

    if (ownedMatches.length > 0) {
      // Pick the best owned item
      const chosen = ownedMatches[0];
      selectedItems.push({
        slot,
        itemId: chosen.itemId,
        productId: chosen.productId,
        name: chosen.name,
        imageUrl: chosen.imageUrl,
        category: chosen.category,
        price: chosen.price,
        source: 'wardrobe',
        locked: false,
      });
      continue;
    }

    // Step 2: If no owned item, look in recommendation candidates
    const candidateMatches = recommendedCandidates.filter((p) => {
      if (p.category !== slot) return false;
      if (budget && p.price > budget) return false;
      return true;
    });

    if (candidateMatches.length > 0) {
      const chosen = candidateMatches[0];
      totalCost += chosen.price;
      selectedItems.push({
        slot,
        itemId: `rec_${chosen.productId}`,
        productId: chosen.productId,
        name: chosen.name,
        imageUrl: chosen.imageUrl,
        category: chosen.category,
        price: chosen.price,
        source: 'recommendation',
        locked: false,
      });
      continue;
    }

    // Otherwise mark as missing
    missingItems.push(slot);
  }

  const coverage = Math.round((selectedItems.length / slotsNeeded.length) * 100);
  const compatibilityScore = Math.round(75 + (selectedItems.length / slotsNeeded.length) * 20);

  const occasionLabel = occasion.charAt(0).toUpperCase() + occasion.slice(1);
  const caption = `${occasionLabel} Ensemble — ${selectedItems.filter((i) => i.source === 'wardrobe').length} pieces from your closet, ${selectedItems.filter((i) => i.source === 'recommendation').length} AI recommendation(s).`;

  return {
    outfitId,
    occasion,
    season,
    items: selectedItems,
    coverage,
    caption,
    totalCost,
    missingItems,
    compatibilityScore,
    createdAt: new Date().toISOString(),
  };
}

export function replaceOutfitSlotItem(
  currentOutfit: OutfitDTO,
  slotToReplace: Category,
  wardrobeItems: WardrobeDocument[],
  recommendedCandidates: ProductDocument[]
): { replacementItem: OutfitItemDTO; updatedOutfit: OutfitDTO } {
  const currentItem = currentOutfit.items.find((i) => i.slot === slotToReplace);

  // Find alternatives for this slot that are NOT the current item
  const ownedAlts = wardrobeItems.filter((w) => w.category === slotToReplace && w.itemId !== currentItem?.itemId);
  const recAlts = recommendedCandidates.filter((p) => p.category === slotToReplace && p.productId !== currentItem?.productId);

  let replacement: OutfitItemDTO;

  if (ownedAlts.length > 0) {
    const chosen = ownedAlts[Math.floor(Math.random() * ownedAlts.length)];
    replacement = {
      slot: slotToReplace,
      itemId: chosen.itemId,
      productId: chosen.productId,
      name: chosen.name,
      imageUrl: chosen.imageUrl,
      category: chosen.category,
      price: chosen.price,
      source: 'wardrobe',
      locked: false,
    };
  } else if (recAlts.length > 0) {
    const chosen = recAlts[Math.floor(Math.random() * recAlts.length)];
    replacement = {
      slot: slotToReplace,
      itemId: `rec_${chosen.productId}`,
      productId: chosen.productId,
      name: chosen.name,
      imageUrl: chosen.imageUrl,
      category: chosen.category,
      price: chosen.price,
      source: 'recommendation',
      locked: false,
    };
  } else {
    // If no alts, keep existing
    replacement = currentItem || {
      slot: slotToReplace,
      itemId: 'unknown',
      name: 'No alternative found',
      imageUrl: '',
      category: slotToReplace,
      price: 0,
      source: 'recommendation',
      locked: false,
    };
  }

  const updatedItems = currentOutfit.items.map((i) => (i.slot === slotToReplace ? replacement : i));
  if (!currentItem) {
    updatedItems.push(replacement);
  }

  const totalCost = updatedItems
    .filter((i) => i.source === 'recommendation')
    .reduce((sum, i) => sum + i.price, 0);

  const updatedOutfit: OutfitDTO = {
    ...currentOutfit,
    items: updatedItems,
    totalCost,
  };

  return { replacementItem: replacement, updatedOutfit };
}

export function shuffleUnlockedOutfitItems(
  currentOutfit: OutfitDTO,
  wardrobeItems: WardrobeDocument[],
  recommendedCandidates: ProductDocument[]
): OutfitDTO {
  const updatedItems: OutfitItemDTO[] = [];
  let totalCost = 0;

  for (const item of currentOutfit.items) {
    if (item.locked) {
      updatedItems.push(item);
      if (item.source === 'recommendation') totalCost += item.price;
      continue;
    }

    // Try finding an alternative item for this slot
    const ownedAlts = wardrobeItems.filter((w) => w.category === item.slot && w.itemId !== item.itemId);
    const recAlts = recommendedCandidates.filter((p) => p.category === item.slot && p.productId !== item.productId);

    if (ownedAlts.length > 0 && Math.random() > 0.4) {
      const chosen = ownedAlts[Math.floor(Math.random() * ownedAlts.length)];
      updatedItems.push({
        slot: item.slot,
        itemId: chosen.itemId,
        productId: chosen.productId,
        name: chosen.name,
        imageUrl: chosen.imageUrl,
        category: chosen.category,
        price: chosen.price,
        source: 'wardrobe',
        locked: false,
      });
    } else if (recAlts.length > 0) {
      const chosen = recAlts[Math.floor(Math.random() * recAlts.length)];
      totalCost += chosen.price;
      updatedItems.push({
        slot: item.slot,
        itemId: `rec_${chosen.productId}`,
        productId: chosen.productId,
        name: chosen.name,
        imageUrl: chosen.imageUrl,
        category: chosen.category,
        price: chosen.price,
        source: 'recommendation',
        locked: false,
      });
    } else {
      updatedItems.push(item);
      if (item.source === 'recommendation') totalCost += item.price;
    }
  }

  return {
    ...currentOutfit,
    items: updatedItems,
    totalCost,
  };
}
