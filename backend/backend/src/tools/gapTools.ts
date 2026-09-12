import { Category, CustomerDocument, WardrobeDocument, Priority } from '../types/domain.js';
import { GapDTO } from '../types/dto.js';
import { WardrobeAnalysis } from './wardrobeTools.js';

export const CATEGORY_BASELINES: Record<Category, number> = {
  top: 4,
  bottom: 3,
  dress: 1,
  outerwear: 2,
  shoes: 2,
  accessory: 2,
  traditional: 1,
};

export interface BrowsingSignalSummary {
  categoryInterest: Record<Category, number>; // weighted interaction count
  recentViewedSubcategories: string[];
}

export function detectGaps(
  analysis: WardrobeAnalysis,
  customer: CustomerDocument,
  ownedItems: WardrobeDocument[],
  browsingSignals?: BrowsingSignalSummary
): GapDTO[] {
  const gaps: GapDTO[] = [];
  const categories: Category[] = ['outerwear', 'bottom', 'top', 'shoes', 'dress', 'accessory'];

  // Helper to find compatible owned items for a gap category
  const findCompatibleOwned = (gapCategory: Category) => {
    // Return items from opposing categories that complete a look
    // e.g. for outerwear or shoes: compatible with tops & bottoms
    return ownedItems
      .filter((item) => {
        if (gapCategory === 'outerwear') return item.category === 'top' || item.category === 'bottom';
        if (gapCategory === 'shoes') return item.category === 'bottom' || item.category === 'dress';
        if (gapCategory === 'bottom') return item.category === 'top' || item.category === 'shoes';
        if (gapCategory === 'top') return item.category === 'bottom' || item.category === 'outerwear';
        if (gapCategory === 'dress') return item.category === 'outerwear' || item.category === 'shoes';
        return item.category === 'top' || item.category === 'bottom';
      })
      .slice(0, 4)
      .map((item) => ({
        itemId: item.itemId,
        name: item.name,
        category: item.category,
        imageUrl: item.imageUrl,
      }));
  };

  // 1. Check Category Shortages
  for (const cat of categories) {
    const currentCount = analysis.categoryCounts[cat] || 0;
    const baseline = CATEGORY_BASELINES[cat];

    if (currentCount < baseline) {
      const shortage = baseline - currentCount;
      const shortageRatio = shortage / baseline;

      // Factors
      // S: Shortage magnitude (0 - 1)
      const S = shortageRatio;

      // O: Occasion alignment
      // If customer has preferred occasions, does this category help?
      const hasWorkwear = customer.preferredOccasions?.includes('workwear');
      const O = hasWorkwear && (cat === 'outerwear' || cat === 'shoes' || cat === 'bottom') ? 0.8 : 0.5;

      // W: Seasonal urgency
      let W = 0.4;
      if ((customer.currentSeason === 'winter' || customer.currentSeason === 'monsoon') && cat === 'outerwear') {
        W = 0.95;
      } else if (customer.currentSeason === 'summer' && (cat === 'top' || cat === 'dress')) {
        W = 0.8;
      }

      // B: Browsing signal
      const browsingScore = browsingSignals?.categoryInterest[cat] || 0;
      const B = Math.min(1.0, browsingScore / 5);

      // U: Combinations unlocked
      const tops = analysis.categoryCounts['top'] || 0;
      const bottoms = analysis.categoryCounts['bottom'] || 0;
      const compatibleCount = cat === 'outerwear' ? Math.min(tops, bottoms) : tops + bottoms;
      const U = Math.min(1.0, compatibleCount / 6);

      const rawScore = 0.35 * S + 0.2 * O + 0.15 * W + 0.15 * B + 0.15 * U;
      const priorityScore = Math.round(Math.min(100, Math.max(10, rawScore * 100)));

      let priority: Priority = 'low';
      if (priorityScore >= 80) priority = 'very_high';
      else if (priorityScore >= 60) priority = 'high';
      else if (priorityScore >= 40) priority = 'medium';

      const outfitsUnlocked = Math.max(2, Math.min(12, compatibleCount * 2));

      let label = `Missing ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
      if (currentCount === 0) label = `Zero ${cat.charAt(0).toUpperCase() + cat.slice(1)} in Closet`;

      let reason = `You currently own ${currentCount} ${cat}s (recommended baseline: ${baseline}).`;
      if (currentCount === 0) {
        reason = `Your wardrobe lacks any ${cat} pieces, severely limiting layered and weather-appropriate outfits.`;
      }

      let supportingSignal = `Category shortage: ${shortage} item(s) below baseline.`;
      if (B > 0.4) {
        supportingSignal += ` Strong browsing interest detected (${browsingScore} interactions).`;
      }

      gaps.push({
        gapId: `gap_cat_${cat}`,
        gapType: 'category',
        label,
        category: cat,
        priority,
        priorityScore,
        reason,
        supportingSignal,
        shortageMagnitude: shortageRatio,
        preferredOccasionRelevance: O,
        seasonRelevance: W,
        browsingRelevance: B,
        outfitsUnlocked,
        compatibleOwnedItems: findCompatibleOwned(cat),
      });
    }
  }

  // 2. Check Occasion Gaps (e.g. Workwear or College missing)
  if (customer.preferredOccasions) {
    for (const occ of customer.preferredOccasions) {
      const countForOccasion = analysis.occasionCoverage[occ] || 0;
      if (countForOccasion < 2) {
        const priorityScore = countForOccasion === 0 ? 82 : 65;
        const priority: Priority = priorityScore >= 80 ? 'very_high' : 'high';

        gaps.push({
          gapId: `gap_occ_${occ}`,
          gapType: 'occasion',
          label: `${occ.charAt(0).toUpperCase() + occ.slice(1)} Wardrobe Deficit`,
          category: analysis.weakestCategory || 'top',
          priority,
          priorityScore,
          reason: `You regularly need clothes for ${occ}, but own only ${countForOccasion} appropriate piece(s).`,
          supportingSignal: `Preferred occasion with low closet coverage (${countForOccasion}/2).`,
          shortageMagnitude: countForOccasion === 0 ? 1.0 : 0.5,
          preferredOccasionRelevance: 0.9,
          seasonRelevance: 0.5,
          browsingRelevance: 0.3,
          outfitsUnlocked: 6,
          compatibleOwnedItems: ownedItems.slice(0, 3).map((i) => ({
            itemId: i.itemId,
            name: i.name,
            category: i.category,
            imageUrl: i.imageUrl,
          })),
        });
      }
    }
  }

  // 3. Check Color Redundancy / Monotony
  const isColorMonochrome =
    analysis.colorDiversity < 55 ||
    (analysis.dominantColors.length > 0 && analysis.redundantItems.some((r) => r.count >= 2));

  if (isColorMonochrome && analysis.dominantColors.length > 0) {
    const dominant = analysis.dominantColors[0];
    gaps.push({
      gapId: `gap_color_redundancy`,
      gapType: 'color_redundancy',
      label: `Palette Imbalance (${dominant.toUpperCase()}-heavy)`,
      category: 'top',
      priority: 'medium',
      priorityScore: 55,
      reason: `Your closet is heavily concentrated in ${dominant}. Adding complementary neutrals or soft tones will unlock new styling versatility.`,
      supportingSignal: `Color diversity score is low (${analysis.colorDiversity}/100).`,
      shortageMagnitude: 0.4,
      preferredOccasionRelevance: 0.4,
      seasonRelevance: 0.4,
      browsingRelevance: 0.2,
      outfitsUnlocked: 5,
      compatibleOwnedItems: ownedItems.slice(0, 3).map((i) => ({
        itemId: i.itemId,
        name: i.name,
        category: i.category,
        imageUrl: i.imageUrl,
      })),
    });
  }

  // Sort by priorityScore descending
  return gaps.sort((a, b) => b.priorityScore - a.priorityScore);
}
