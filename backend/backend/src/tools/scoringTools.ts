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
  browsingWeight = 0,
  purchaseSignals?: { preferredStores?: string[]; recentPurchases?: any[]; averagePrice?: number },
  browsingSignals?: { recentViewedSubcategories?: string[] },
  weatherCondition?: string
): ScoredProductResult {
  // 1. Gap Relevance (Weight: 30%)
  let gapRaw = 20; // default baseline gap need
  let matchingGap: GapDTO | null = null;

  for (const gap of gaps) {
    if (gap.category === product.category) {
      matchingGap = gap;
      gapRaw = gap.priorityScore || 70;
      break;
    }
  }
  const gapScore = Math.round((gapRaw / 100) * 30);

  // 2. Profile Score (Weight: 20%) - Color, Occasion, Budget
  let profileRaw = 40;
  const prodColor = product.color.toLowerCase();
  const neutrals = ['black', 'white', 'grey', 'gray', 'beige', 'navy', 'cream', 'denim'];
  let colorPts = 10;
  if (customer.preferredColors && customer.preferredColors.some((c) => c.toLowerCase() === prodColor)) {
    colorPts = 35;
  } else if (neutrals.includes(prodColor)) {
    colorPts = 25;
  }

  let occasionPts = 15;
  if (customer.preferredOccasions && product.occasion) {
    const hasOverlap = product.occasion.some((occ) => customer.preferredOccasions.includes(occ));
    if (hasOverlap) occasionPts = 35;
  }

  let budgetPts = 30;
  if (customer.budget && customer.budget > 0) {
    if (product.price <= customer.budget) {
      budgetPts = 30;
    } else {
      const overage = (product.price - customer.budget) / customer.budget;
      budgetPts = Math.round(Math.max(0, 30 * (1 - overage)));
    }
  }
  profileRaw = Math.min(100, colorPts + occasionPts + budgetPts);
  const profileScore = Math.round((profileRaw / 100) * 20);

  // 3. Purchase Score (Weight: 15%) - Store affinity, price consistency, history
  let purchaseRaw = 40;
  if (purchaseSignals) {
    let storePts = 10;
    if (purchaseSignals.preferredStores && purchaseSignals.preferredStores.includes(product.store)) {
      storePts = 45;
    }
    let pricePts = 25;
    if (purchaseSignals.averagePrice && purchaseSignals.averagePrice > 0) {
      const diff = Math.abs(product.price - purchaseSignals.averagePrice) / purchaseSignals.averagePrice;
      pricePts = Math.round(Math.max(10, 40 * (1 - Math.min(1, diff))));
    }
    purchaseRaw = Math.min(100, storePts + pricePts + 15);
  }
  const purchaseScore = Math.round((purchaseRaw / 100) * 15);

  // 4. Browsing Score (Weight: 15%) - Recent telemetry, click/view velocity
  let browsingRaw = Math.min(100, Math.round(browsingWeight * 15));
  if (browsingSignals && browsingSignals.recentViewedSubcategories) {
    if (browsingSignals.recentViewedSubcategories.includes(product.subcategory)) {
      browsingRaw = Math.min(100, browsingRaw + 40);
    }
  }
  const computedBrowsingScore = Math.max(5, Math.round((browsingRaw / 100) * 15));

  // 5. Seasonal / Weather Score (Weight: 10%)
  let seasonRaw = 50;
  if (product.season) {
    if (product.season.includes('all-season') || (customer.currentSeason && product.season.includes(customer.currentSeason))) {
      seasonRaw = 90;
    } else {
      seasonRaw = 40;
    }
  }
  if (weatherCondition && product.weatherSuitability) {
    if (product.weatherSuitability.includes(weatherCondition.toLowerCase())) {
      seasonRaw = Math.min(100, seasonRaw + 10);
    }
  }
  const seasonalScore = Math.round((seasonRaw / 100) * 10);

  // 6. Style Score (Weight: 10%)
  let styleRaw = 40;
  if (customer.preferredStyles && customer.preferredStyles.length > 0 && product.styleTags) {
    const customerStyles = customer.preferredStyles.map((s) => s.toLowerCase());
    const matches = product.styleTags.filter((t) => customerStyles.includes(t.toLowerCase())).length;
    if (matches >= 2) styleRaw = 100;
    else if (matches === 1) styleRaw = 80;
    else styleRaw = 40;
  }
  const styleScore = Math.round((styleRaw / 100) * 10);

  // Duplicate Check
  const duplicateCheck = detectDuplicate(product, ownedItems);
  const duplicatePenalty = duplicateCheck.penalty;

  // Final 6-Signal Score calculation: Gap(30%) + Profile(20%) + Purchase(15%) + Browsing(15%) + Season(10%) + Style(10%)
  const rawScore =
    gapScore +
    profileScore +
    purchaseScore +
    computedBrowsingScore +
    seasonalScore +
    styleScore +
    duplicatePenalty;

  const finalScore = Math.max(10, Math.min(99, Math.round(rawScore)));

  const scoreBreakdown: ScoreBreakdownDTO = {
    gapScore,
    profileScore,
    purchaseScore,
    browsingScore: computedBrowsingScore,
    seasonalScore,
    styleScore,
    duplicatePenalty,
    finalScore,
    // Backwards compatibility mappings
    gapRelevance: gapScore,
    styleCompatibility: styleScore * 2,
    colorCompatibility: Math.round(colorPts * 0.4),
    occasionCompatibility: Math.round(occasionPts * 0.4),
    budgetCompatibility: Math.round(budgetPts * 0.3),
    seasonCompatibility: seasonalScore,
    browsingBoost: computedBrowsingScore,
  };

  // Find compatible items from owned wardrobe to pair with
  const compatibleWardrobeItems = ownedItems
    .filter((owned) => {
      if (owned.category === product.category) return false;
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

  // Construct transparent, customer-signal grounded WhyThis explanations
  const reasons: string[] = [];
  if (matchingGap) {
    const priorityLabel = matchingGap.priority ? String(matchingGap.priority).replace('_', ' ') : 'high';
    reasons.push(`Fills a gap in your ${matchingGap.category} collection (${priorityLabel} priority).`);
  }
  if (browsingSignals && browsingSignals.recentViewedSubcategories && browsingSignals.recentViewedSubcategories.includes(product.subcategory)) {
    reasons.push(`Matches your recent browsing for ${product.subcategory}.`);
  }
  if (purchaseSignals && purchaseSignals.preferredStores && purchaseSignals.preferredStores.includes(product.store)) {
    reasons.push(`Aligns with your trusted store preference for ${product.store}.`);
  }
  if (seasonalScore >= 8) {
    reasons.push(`Suited for current ${customer.currentSeason || 'active'} climate in ${customer.city || customer.country || 'your region'}.`);
  }
  if (styleScore >= 8) {
    reasons.push(`Matches your preferred ${customer.preferredStyles?.join(' & ')} aesthetic.`);
  }

  const whyThis = reasons.length > 0 ? reasons.join(' ') : `High overall styling match with your personal wardrobe profile.`;

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
