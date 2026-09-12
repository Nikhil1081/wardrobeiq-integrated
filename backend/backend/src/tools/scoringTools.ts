import { ProductDocument, CustomerDocument, WardrobeDocument, Category } from '../types/domain.js';
import { GapDTO, ScoreBreakdownDTO } from '../types/dto.js';

export interface ScoredProductResult {
  product: ProductDocument;
  score: number;
  scoreBreakdown: ScoreBreakdownDTO;
  whyThis: string;
  compatibleWardrobeItems: Array<{ itemId: string; name: string; category: Category; imageUrl: string }>;
  filledGap: { gapId: string; label: string; priority: any } | null;
  duplicatePenaltyApplied: boolean;
}

export function detectDuplicate(
  product: ProductDocument,
  ownedItems: WardrobeDocument[]
): { isDuplicate: boolean; penalty: number; reason?: string } {
  const prodSubcat = product.subcategory.toLowerCase();
  const prodColor = product.color.toLowerCase();

  for (const owned of ownedItems) {
    if (owned.category === product.category) {
      const ownedSubcat = owned.subcategory.toLowerCase();
      const ownedColor = owned.color.toLowerCase();

      // Exact subcategory and exact color match -> Severe duplicate penalty (-30)
      if (ownedSubcat === prodSubcat && ownedColor === prodColor) {
        return {
          isDuplicate: true,
          penalty: -30,
          reason: `You already own a ${owned.color} ${owned.subcategory} (${owned.name})`,
        };
      }

      // Exact subcategory but different color -> Moderate duplicate penalty (-12)
      if (ownedSubcat === prodSubcat) {
        return {
          isDuplicate: true,
          penalty: -12,
          reason: `You already own a ${owned.subcategory} in ${owned.color}`,
        };
      }
    }
  }

  return { isDuplicate: false, penalty: 0 };
}

export function scoreProductCandidate(
  product: ProductDocument,
  customer: CustomerDocument,
  gaps: GapDTO[],
  ownedItems: WardrobeDocument[],
  browsingScore = 0
): ScoredProductResult {
  // 1. Gap Relevance (30%)
  let gapRelevance = 5; // default minimal score
  let matchingGap: GapDTO | null = null;

  for (const gap of gaps) {
    if (gap.category === product.category) {
      matchingGap = gap;
      // Scale based on priorityScore (0-100) -> (0-30)
      gapRelevance = Math.round((gap.priorityScore / 100) * 30);
      break;
    }
  }

  // 2. Style Compatibility (20%)
  let styleCompatibility = 6;
  if (customer.preferredStyles && customer.preferredStyles.length > 0 && product.styleTags) {
    const customerStyles = customer.preferredStyles.map((s) => s.toLowerCase());
    const matches = product.styleTags.filter((t) => customerStyles.includes(t.toLowerCase())).length;
    if (matches >= 2) styleCompatibility = 20;
    else if (matches === 1) styleCompatibility = 16;
    else styleCompatibility = 8;
  }

  // 3. Color Compatibility (15%)
  let colorCompatibility = 6;
  const prodColor = product.color.toLowerCase();
  const neutrals = ['black', 'white', 'grey', 'gray', 'beige', 'navy', 'cream', 'denim'];

  if (customer.preferredColors && customer.preferredColors.some((c) => c.toLowerCase() === prodColor)) {
    colorCompatibility = 15;
  } else if (neutrals.includes(prodColor)) {
    colorCompatibility = 13;
  }

  // 4. Occasion Compatibility (15%)
  let occasionCompatibility = 6;
  if (customer.preferredOccasions && product.occasion) {
    const hasOverlap = product.occasion.some((occ) => customer.preferredOccasions.includes(occ));
    if (hasOverlap) occasionCompatibility = 15;
    else occasionCompatibility = 8;
  }

  // 5. Budget Compatibility (10%)
  let budgetCompatibility = 10;
  if (customer.budget && customer.budget > 0) {
    if (product.price <= customer.budget) {
      budgetCompatibility = 10;
    } else {
      const overageRatio = (product.price - customer.budget) / customer.budget;
      budgetCompatibility = Math.round(Math.max(0, 10 * (1 - overageRatio)));
    }
  }

  // 6. Season Compatibility (10%)
  let seasonCompatibility = 5;
  if (product.season) {
    if (product.season.includes('all-season') || (customer.currentSeason && product.season.includes(customer.currentSeason))) {
      seasonCompatibility = 10;
    } else {
      seasonCompatibility = 4;
    }
  }

  // 7. Browsing Boost (0 to 15%)
  const browsingBoost = Math.min(15, Math.round(browsingScore * 2));

  // 8. Duplicate Penalty (-30% to 0)
  const duplicateCheck = detectDuplicate(product, ownedItems);
  const duplicatePenalty = duplicateCheck.penalty;

  // Final Score calculation
  const rawScore =
    gapRelevance +
    styleCompatibility +
    colorCompatibility +
    occasionCompatibility +
    budgetCompatibility +
    seasonCompatibility +
    browsingBoost +
    duplicatePenalty;

  const finalScore = Math.max(10, Math.min(99, Math.round(rawScore)));

  const scoreBreakdown: ScoreBreakdownDTO = {
    gapRelevance,
    styleCompatibility,
    colorCompatibility,
    occasionCompatibility,
    budgetCompatibility,
    seasonCompatibility,
    browsingBoost,
    duplicatePenalty,
    finalScore,
  };

  // Find compatible items from owned wardrobe to pair with
  const compatibleWardrobeItems = ownedItems
    .filter((owned) => {
      // Must be from different category
      if (owned.category === product.category) return false;
      // Pair tops with bottoms, outerwear with tops, etc.
      if (product.category === 'top') return owned.category === 'bottom' || owned.category === 'outerwear';
      if (product.category === 'bottom') return owned.category === 'top' || owned.category === 'shoes';
      if (product.category === 'outerwear') return owned.category === 'top' || owned.category === 'bottom';
      if (product.category === 'shoes') return owned.category === 'bottom' || owned.category === 'dress';
      if (product.category === 'dress') return owned.category === 'outerwear' || owned.category === 'shoes';
      return owned.category === 'top' || owned.category === 'bottom';
    })
    .slice(0, 3)
    .map((o) => ({
      itemId: o.itemId,
      name: o.name,
      category: o.category,
      imageUrl: o.imageUrl,
    }));

  // Construct grounded WhyThis reason
  const reasons: string[] = [];
  if (matchingGap) {
    reasons.push(`Completes your ${matchingGap.category} gap (${matchingGap.priority.replace('_', ' ')} priority).`);
  }
  if (styleCompatibility >= 15) {
    reasons.push(`Matches your ${customer.preferredStyles?.join(' & ')} style.`);
  }
  if (compatibleWardrobeItems.length > 0) {
    reasons.push(`Pairs seamlessly with ${compatibleWardrobeItems.length} pieces currently in your closet.`);
  }
  if (budgetCompatibility === 10) {
    reasons.push(`Comfortably fits within your ₹${customer.budget} budget.`);
  }
  if (browsingBoost > 5) {
    reasons.push(`Aligns with your recent browsing activity.`);
  }

  const whyThis = reasons.length > 0 ? reasons.join(' ') : 'High overall compatibility with your personal wardrobe profile.';

  return {
    product,
    score: finalScore,
    scoreBreakdown,
    whyThis,
    compatibleWardrobeItems,
    filledGap: matchingGap
      ? {
          gapId: matchingGap.gapId,
          label: matchingGap.label,
          priority: matchingGap.priority,
        }
      : null,
    duplicatePenaltyApplied: duplicateCheck.isDuplicate,
  };
}
