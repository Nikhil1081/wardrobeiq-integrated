import { getCustomerProfile } from '../tools/customerTools.js';
import { getWardrobeItems, analyzeWardrobe } from '../tools/wardrobeTools.js';
import { detectGaps } from '../tools/gapTools.js';
import { getCustomerBrowsingSignals } from '../tools/browsingTools.js';
import { getCustomerPurchaseSignals } from '../tools/purchaseTools.js';
import { getRecommendationCandidates, getProductById, toProductCardDTO } from '../tools/catalogueTools.js';
import { scoreProductCandidate } from '../tools/scoringTools.js';
import { getProductOffers, validateOfferConditions, toOfferDTO } from '../tools/offerTools.js';
import { generateOutfitLook } from '../tools/outfitTools.js';
import { getSavedItemsCollection } from '../db/collections.js';
import { RecommendationDTO, OutfitDTO, OfferDTO, WhyThisDTO } from '../types/dto.js';
import { Category, Occasion, Season } from '../types/domain.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getPersonalizedRecommendationsService(
  customerId: string,
  queryText?: string,
  filters?: {
    category?: Category;
    occasion?: Occasion;
    season?: Season;
    maxBudget?: number;
    color?: string;
    style?: string;
  }
): Promise<{
  summary: string;
  constraints: any;
  recommendations: RecommendationDTO[];
  outfits: OutfitDTO[];
  activeOffers: OfferDTO[];
  mode: 'openai' | 'deterministic';
}> {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const wardrobe = await getWardrobeItems(customerId);
  const analysis = analyzeWardrobe(wardrobe, customer);
  const browsingSignals = await getCustomerBrowsingSignals(customerId);
  const purchaseSignals = await getCustomerPurchaseSignals(customerId);
  const gaps = detectGaps(analysis, customer, wardrobe, browsingSignals.summary);

  const ownedProductIds = new Set(wardrobe.map((w) => w.productId).filter(Boolean) as string[]);

  // Get saved items for isSaved badge
  const savedCollection = getSavedItemsCollection();
  const savedDocs = await savedCollection.find({ customerId }).toArray();
  const savedProductIds = new Set(savedDocs.map((s) => s.productId));

  // Determine target filters
  const targetCategory = filters?.category;
  const budgetCeiling = filters?.maxBudget || customer.budget;

  // Retrieve candidate pool (strictly excluding owned items and avoided colors)
  const rawCandidates = await getRecommendationCandidates(
    customer,
    ownedProductIds,
    targetCategory,
    budgetCeiling ? budgetCeiling * 1.3 : undefined
  );

  // Apply runtime filters and guarantee 100% duplicate exclusion
  const candidates = rawCandidates.filter((p) => {
    if (ownedProductIds.has(p.productId)) return false;
    if (filters?.occasion && !p.occasion.includes(filters.occasion)) return false;
    if (filters?.season && !p.season.includes(filters.season) && !p.season.includes('all-season')) return false;
    if (filters?.color && p.color.toLowerCase() !== filters.color.toLowerCase()) return false;
    if (filters?.style && !p.styleTags.map((s) => s.toLowerCase()).includes(filters.style.toLowerCase())) return false;
    return true;
  });

  // Score candidate items using 6-signal weighted formula
  const scoredItems = candidates.map((prod) => {
    const browsingWeight = browsingSignals.productWeights.get(prod.productId) || 0;
    return scoreProductCandidate(
      prod,
      customer,
      gaps,
      wardrobe,
      browsingWeight,
      purchaseSignals,
      browsingSignals.summary,
      customer.climate
    );
  });

  // Rank by score descending
  scoredItems.sort((a, b) => b.score - a.score);

  const activeOffers: OfferDTO[] = [];
  const recommendations: RecommendationDTO[] = [];

  for (const item of scoredItems.slice(0, 15)) {
    const baseCard = toProductCardDTO(item.product);
    let attachedOffer: OfferDTO | null = null;

    // Check offers
    const offers = await getProductOffers(item.product.productId);
    for (const offer of offers) {
      const validation = validateOfferConditions(offer, item.product, wardrobe);
      if (validation.isEligible) {
        attachedOffer = toOfferDTO(offer, item.product, true, validation.reason, validation.label);
        activeOffers.push(attachedOffer);
        break;
      }
    }

    recommendations.push({
      ...baseCard,
      score: item.score,
      scoreBreakdown: item.scoreBreakdown,
      whyThis: item.whyThis,
      compatibleWardrobeItems: item.compatibleWardrobeItems,
      filledGap: item.filledGap,
      applicableOffer: attachedOffer,
      isSaved: savedProductIds.has(item.product.productId),
      isInCloset: false,
      browsingSignal: browsingSignals.productWeights.has(item.product.productId)
        ? { viewCount: browsingSignals.productWeights.get(item.product.productId)!, lastEvent: 'viewed' }
        : undefined,
    });
  }

  // Generate outfit preview
  const primaryOccasion = filters?.occasion || customer.preferredOccasions?.[0] || 'casual';
  const primarySeason = filters?.season || customer.currentSeason || 'all-season';
  const outfit = generateOutfitLook(
    customerId,
    primaryOccasion,
    primarySeason,
    wardrobe,
    candidates,
    budgetCeiling
  );

  const topGapLabel = gaps.length > 0 ? gaps[0].label : 'wardrobe enhancement';
  const summary = `Generated ${recommendations.length} tailored recommendation(s) prioritizing ${topGapLabel} and your ${customer.preferredStyles?.join(', ')} style.`;

  return {
    summary,
    constraints: {
      budget: budgetCeiling,
      occasion: primaryOccasion,
      season: primarySeason,
      avoidedColors: customer.avoidedColors,
    },
    recommendations,
    outfits: [outfit],
    activeOffers,
    mode: 'deterministic',
  };
}

export async function getWhyThisExplanationService(
  customerId: string,
  productId: string
): Promise<WhyThisDTO> {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const product = await getProductById(productId);
  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', `Product with ID ${productId} not found.`);
  }

  const wardrobe = await getWardrobeItems(customerId);
  const analysis = analyzeWardrobe(wardrobe, customer);
  const browsingSignals = await getCustomerBrowsingSignals(customerId);
  const gaps = detectGaps(analysis, customer, wardrobe, browsingSignals.summary);

  const bScore = browsingSignals.productWeights.get(productId) || 0;
  const scored = scoreProductCandidate(product, customer, gaps, wardrobe, bScore);

  // Check matching gap
  const matchingGap = gaps.find((g) => g.category === product.category);

  // Check offers
  let offerReason: string | undefined;
  const offers = await getProductOffers(productId);
  if (offers.length > 0) {
    const val = validateOfferConditions(offers[0], product, wardrobe);
    if (val.isEligible) {
      offerReason = `${offers[0].discountPercentage}% discount valid until ${offers[0].validUntil.split('T')[0]}`;
    }
  }

  return {
    productId: product.productId,
    productName: product.name,
    gapFilled: matchingGap ? `Addresses your ${matchingGap.label} (${matchingGap.priority.replace('_', ' ')} priority)` : null,
    wardrobeCompatibility: `Directly coordinates with ${scored.compatibleWardrobeItems.length} piece(s) in your existing collection.`,
    compatibleItems: scored.compatibleWardrobeItems.map((i) => ({
      itemId: i.itemId,
      name: i.name,
      category: i.category,
    })),
    styleReason: `Matches your ${customer.preferredStyles.join(' and ')} style preference.`,
    colorReason: customer.preferredColors.includes(product.color.toLowerCase())
      ? `Matches your favorite color ${product.color}.`
      : `Versatile ${product.color} hue complements your current wardrobe palette.`,
    occasionReason: `Appropriate for ${product.occasion.join(', ')}.`,
    seasonReason: product.season.includes('all-season')
      ? 'All-season wearable staple.'
      : `Ideal for ${product.season.join(', ')} wear.`,
    budgetReason: product.price <= customer.budget
      ? `Price ₹${product.price} is well within your ₹${customer.budget} budget.`
      : `Priced at ₹${product.price} (slightly above budget for high versatility).`,
    browsingReason: bScore > 0
      ? `Supported by ${bScore} demonstrated browsing interactions.`
      : 'Curated based on closet synergy.',
    offerReason,
    scoreBreakdown: scored.scoreBreakdown,
  };
}
