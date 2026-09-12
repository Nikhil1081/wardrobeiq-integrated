import { getCustomerProfile } from '../tools/customerTools.js';
import { getWardrobeItems, analyzeWardrobe, toWardrobeItemDTO } from '../tools/wardrobeTools.js';
import { detectGaps } from '../tools/gapTools.js';
import { getCustomerBrowsingSignals } from '../tools/browsingTools.js';
import { getRecommendationCandidates, toProductCardDTO } from '../tools/catalogueTools.js';
import { scoreProductCandidate } from '../tools/scoringTools.js';
import { GapDTO, RecommendationDTO, WardrobeItemDTO } from '../types/dto.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getCustomerGapsService(customerId: string): Promise<GapDTO[]> {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const ownedItems = await getWardrobeItems(customerId);
  const analysis = analyzeWardrobe(ownedItems, customer);
  const browsingSignals = await getCustomerBrowsingSignals(customerId);

  return detectGaps(analysis, customer, ownedItems, browsingSignals.summary);
}

export async function getGapDetailService(
  customerId: string,
  gapId: string
): Promise<{
  gap: GapDTO;
  reason: string;
  ownedItems: WardrobeItemDTO[];
  compatibleProducts: RecommendationDTO[];
  outfitsUnlocked: number;
  recommendedBudgetRange: { min: number; max: number };
}> {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const ownedItems = await getWardrobeItems(customerId);
  const analysis = analyzeWardrobe(ownedItems, customer);
  const browsingSignals = await getCustomerBrowsingSignals(customerId);
  const allGaps = detectGaps(analysis, customer, ownedItems, browsingSignals.summary);

  const targetGap = allGaps.find((g) => g.gapId === gapId);
  if (!targetGap) {
    throw new AppError(404, 'GAP_NOT_FOUND', `Wardrobe gap with ID ${gapId} not found.`);
  }

  // Find compatible catalog products that directly fill this gap
  const ownedProductIds = new Set(ownedItems.map((i) => i.productId).filter(Boolean) as string[]);
  const candidates = await getRecommendationCandidates(customer, ownedProductIds, targetGap.category);

  const scoredCandidates = candidates
    .map((prod) => {
      const bScore = browsingSignals.productWeights.get(prod.productId) || 0;
      const scored = scoreProductCandidate(prod, customer, [targetGap], ownedItems, bScore);
      return {
        ...toProductCardDTO(prod),
        score: scored.score,
        scoreBreakdown: scored.scoreBreakdown,
        whyThis: scored.whyThis,
        compatibleWardrobeItems: scored.compatibleWardrobeItems,
        filledGap: { gapId: targetGap.gapId, label: targetGap.label, priority: targetGap.priority },
        applicableOffer: null,
        isSaved: false,
        isInCloset: false,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const minBudget = Math.round((customer.budget || 2000) * 0.5);
  const maxBudget = Math.round((customer.budget || 2000) * 1.2);

  return {
    gap: targetGap,
    reason: targetGap.reason,
    ownedItems: targetGap.compatibleOwnedItems.map((c) => {
      const full = ownedItems.find((o) => o.itemId === c.itemId);
      return full ? toWardrobeItemDTO(full) : (c as any);
    }),
    compatibleProducts: scoredCandidates,
    outfitsUnlocked: targetGap.outfitsUnlocked,
    recommendedBudgetRange: { min: minBudget, max: maxBudget },
  };
}
