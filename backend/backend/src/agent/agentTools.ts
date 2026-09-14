import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getCustomerProfile } from '../tools/customerTools.js';
import { getWardrobeItems, analyzeWardrobe, WardrobeAnalysis } from '../tools/wardrobeTools.js';
import { detectGaps } from '../tools/gapTools.js';
import { getCustomerBrowsingSignals } from '../tools/browsingTools.js';
import {
  searchCatalogueProducts,
  getRecommendationCandidates,
  getProductById,
  toProductCardDTO,
} from '../tools/catalogueTools.js';
import { scoreProductCandidate } from '../tools/scoringTools.js';
import { getProductOffers, validateOfferConditions, toOfferDTO } from '../tools/offerTools.js';
import { generateOutfitLook } from '../tools/outfitTools.js';
import { Category, Occasion, Season, CustomerDocument, WardrobeDocument, ProductDocument } from '../types/domain.js';
import { GapDTO, RecommendationDTO, OutfitDTO, OfferDTO } from '../types/dto.js';

// 1. get_customer_profile
export const getCustomerProfileTool = tool(
  async ({ customerId }: { customerId: string }) => {
    const customer = await getCustomerProfile(customerId);
    if (!customer) {
      return JSON.stringify({ error: `Customer profile not found for ID ${customerId}` });
    }
    return JSON.stringify({
      customerId: customer.customerId,
      name: customer.name,
      preferredStyles: customer.preferredStyles || [],
      preferredColors: customer.preferredColors || [],
      avoidedColors: customer.avoidedColors || [],
      preferredOccasions: customer.preferredOccasions || [],
      currentSeason: customer.currentSeason || 'all-season',
      budget: customer.budget || 5000,
    });
  },
  {
    name: 'get_customer_profile',
    description:
      'Retrieve customer fashion preferences, style affinities, avoided colors, preferred occasions, seasonal settings, and budget limits.',
    schema: z.object({
      customerId: z.string().describe('The unique identifier of the customer (e.g. C001, C002, admin_root)'),
    }),
  }
);

// 2. get_wardrobe
export const getWardrobeTool = tool(
  async ({
    customerId,
    category,
    occasion,
    season,
  }: {
    customerId: string;
    category?: string;
    occasion?: string;
    season?: string;
  }) => {
    const filterCriteria: any = {};
    if (category) filterCriteria.category = category as Category;
    if (occasion) filterCriteria.occasion = occasion as Occasion;
    if (season) filterCriteria.season = season as Season;

    const items = await getWardrobeItems(customerId, filterCriteria);
    const compact = items.map((w) => ({
      itemId: w.itemId,
      name: w.name,
      category: w.category,
      subcategory: w.subcategory,
      color: w.color,
      styleTags: w.styleTags,
      occasion: w.occasion,
      season: w.season,
      price: w.price,
    }));

    return JSON.stringify({
      totalCount: compact.length,
      items: compact,
    });
  },
  {
    name: 'get_wardrobe',
    description:
      'Retrieve the customer owned wardrobe closet items. Filter by category (top, bottom, dress, outerwear, shoes, accessory, traditional), occasion, or season when specific items are requested.',
    schema: z.object({
      customerId: z.string().describe('The customer ID'),
      category: z
        .enum(['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'traditional'])
        .nullable()
        .optional()
        .describe('Filter by specific clothing category'),
      occasion: z
        .enum(['casual', 'college', 'workwear', 'dateNight', 'weekend', 'party'])
        .nullable()
        .optional()
        .describe('Filter by occasion'),
      season: z
        .enum(['summer', 'winter', 'monsoon', 'all-season'])
        .nullable()
        .optional()
        .describe('Filter by season'),
    }),
  }
);

// 3. analyze_wardrobe
export const analyzeWardrobeTool = tool(
  async ({ customerId }: { customerId: string }) => {
    const [wardrobe, customer] = await Promise.all([
      getWardrobeItems(customerId),
      getCustomerProfile(customerId),
    ]);

    if (!wardrobe || wardrobe.length === 0) {
      return JSON.stringify({
        totalItems: 0,
        message: 'Wardrobe is empty or has no logged items.',
      });
    }

    const analysis = analyzeWardrobe(wardrobe, customer || undefined);
    return JSON.stringify({
      totalItems: analysis.totalItems,
      categoryCounts: analysis.categoryCounts,
      dominantColors: analysis.dominantColors,
      dominantStyles: analysis.dominantStyles,
      occasionCoverage: analysis.occasionCoverage,
      colorDiversityScore: analysis.colorDiversity,
      topCategory: analysis.topCategory,
      weakestCategory: analysis.weakestCategory,
      redundantItemsCount: analysis.redundantItems.length,
    });
  },
  {
    name: 'analyze_wardrobe',
    description:
      'Analyze the composition, category distribution, color diversity, and occasion coverage of the customer wardrobe. Use when evaluating wardrobe diversity, balance, or missing versatility.',
    schema: z.object({
      customerId: z.string().describe('The customer ID to analyze'),
    }),
  }
);

// 4. detect_wardrobe_gaps
export const detectWardrobeGapsTool = tool(
  async ({ customerId }: { customerId: string }) => {
    const [wardrobe, customer, browsing] = await Promise.all([
      getWardrobeItems(customerId),
      getCustomerProfile(customerId),
      getCustomerBrowsingSignals(customerId),
    ]);

    if (!customer) {
      return JSON.stringify({ error: `Customer profile not found for ${customerId}` });
    }

    const analysis = analyzeWardrobe(wardrobe, customer);
    const gaps = detectGaps(analysis, customer, wardrobe, browsing?.summary);

    return JSON.stringify({
      gapCount: gaps.length,
      gaps: gaps.map((g) => ({
        gapId: g.gapId,
        category: g.category,
        label: g.label,
        priority: g.priority,
        reason: g.reason,
        supportingSignal: g.supportingSignal,
        shortageMagnitude: g.shortageMagnitude,
      })),
    });
  },
  {
    name: 'detect_wardrobe_gaps',
    description:
      'Identify missing or weak wardrobe categories and essential gaps based on standard style baselines, customer lifestyle, and browsing intent. Call when the user asks what they are missing, what to buy, or how to improve their closet.',
    schema: z.object({
      customerId: z.string().describe('The customer ID'),
    }),
  }
);

// 5. search_products
export const searchProductsTool = tool(
  async ({
    category,
    occasion,
    maxPrice,
    search,
    color,
    limit,
  }: {
    category?: string;
    occasion?: string;
    maxPrice?: number;
    search?: string;
    color?: string;
    limit?: number;
  }) => {
    const criteria: any = {
      limit: limit || 12,
    };
    if (category) criteria.category = category as Category;
    if (occasion) criteria.occasion = occasion as Occasion;
    if (maxPrice) criteria.maxPrice = maxPrice;
    if (search) criteria.search = search;
    if (color) criteria.color = color;

    const result = await searchCatalogueProducts(criteria);
    const compact = result.products.map((p) => ({
      productId: p.productId,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      color: p.color,
      price: p.price,
      originalPrice: p.originalPrice,
      store: p.store,
      styleTags: p.styleTags,
      badges: toProductCardDTO(p).badges,
    }));

    return JSON.stringify({
      totalMatches: result.total,
      returnedCount: compact.length,
      products: compact,
    });
  },
  {
    name: 'search_products',
    description:
      'Search the product catalogue for clothing items matching category, occasion, maxPrice, color, or keyword. Call when the user wants to buy something, needs external pieces, or when wardrobe lacks required items.',
    schema: z.object({
      category: z
        .enum(['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'traditional'])
        .nullable()
        .optional()
        .describe('Product category'),
      occasion: z
        .enum(['casual', 'college', 'workwear', 'dateNight', 'weekend', 'party'])
        .nullable()
        .optional()
        .describe('Occasion style'),
      maxPrice: z.number().nullable().optional().describe('Maximum budget / price ceiling in INR'),
      search: z.string().nullable().optional().describe('Search keyword e.g. "blazer", "black shirt", "denim jacket"'),
      color: z.string().nullable().optional().describe('Specific color e.g. black, blue, beige, white'),
      limit: z.number().nullable().optional().describe('Maximum number of items to return (default 12)'),
    }),
  }
);

// 6. filter_products
export const filterProductsTool = tool(
  async ({
    productIds,
    customerId,
    avoidedColors,
    maxPrice,
  }: {
    productIds: string[];
    customerId?: string;
    avoidedColors?: string[];
    maxPrice?: number;
  }) => {
    let customer: CustomerDocument | null = null;
    let ownedProductIds = new Set<string>();

    if (customerId) {
      const [c, wardrobe] = await Promise.all([
        getCustomerProfile(customerId),
        getWardrobeItems(customerId),
      ]);
      customer = c;
      ownedProductIds = new Set(wardrobe.map((w) => w.productId).filter(Boolean) as string[]);
    }

    const effectiveAvoided = avoidedColors || customer?.avoidedColors || [];
    const effectiveMaxPrice = maxPrice || customer?.budget;

    const filtered: ProductDocument[] = [];
    const excludedReasons: Record<string, string> = {};

    for (const pid of productIds) {
      const prod = await getProductById(pid);
      if (!prod) continue;

      if (ownedProductIds.has(prod.productId)) {
        excludedReasons[pid] = 'Already owned in wardrobe';
        continue;
      }

      if (effectiveAvoided.some((ac) => ac.toLowerCase() === prod.color.toLowerCase())) {
        excludedReasons[pid] = `Matches avoided color (${prod.color})`;
        continue;
      }

      if (effectiveMaxPrice && prod.price > effectiveMaxPrice) {
        excludedReasons[pid] = `Price ₹${prod.price} exceeds budget ₹${effectiveMaxPrice}`;
        continue;
      }

      filtered.push(prod);
    }

    return JSON.stringify({
      passedCount: filtered.length,
      filteredProductIds: filtered.map((p) => p.productId),
      excludedCount: Object.keys(excludedReasons).length,
      samplePassed: filtered.slice(0, 6).map((p) => ({
        productId: p.productId,
        name: p.name,
        price: p.price,
        color: p.color,
      })),
    });
  },
  {
    name: 'filter_products',
    description:
      'Filter candidate product IDs using customer avoided colors, already owned items, and price ceiling.',
    schema: z.object({
      productIds: z.array(z.string()).describe('List of product IDs to filter'),
      customerId: z.string().nullable().optional().describe('Customer ID to check owned items and avoided preferences'),
      avoidedColors: z.array(z.string()).nullable().optional().describe('Colors to strictly filter out'),
      maxPrice: z.number().nullable().optional().describe('Price ceiling in INR'),
    }),
  }
);

// 7. rank_products
export const rankProductsTool = tool(
  async ({
    customerId,
    productIds,
  }: {
    customerId: string;
    productIds: string[];
  }) => {
    const [customer, wardrobe, browsing] = await Promise.all([
      getCustomerProfile(customerId),
      getWardrobeItems(customerId),
      getCustomerBrowsingSignals(customerId),
    ]);

    if (!customer) {
      return JSON.stringify({ error: `Customer profile not found for ${customerId}` });
    }

    const analysis = analyzeWardrobe(wardrobe, customer);
    const gaps = detectGaps(analysis, customer, wardrobe, browsing?.summary);
    const browsingWeights = browsing?.productWeights || new Map<string, number>();

    const products: ProductDocument[] = [];
    for (const pid of productIds) {
      const prod = await getProductById(pid);
      if (prod) products.push(prod);
    }

    const scoredList = products.map((prod) => {
      const browsingScore = browsingWeights.get(prod.productId) || 0;
      return scoreProductCandidate(prod, customer, gaps, wardrobe, browsingScore);
    });

    scoredList.sort((a, b) => b.score - a.score);
    const topScored = scoredList.slice(0, 8);

    const ranked = topScored.map((item) => {
      const card = toProductCardDTO(item.product);
      return {
        ...card,
        score: item.score,
        scoreBreakdown: item.scoreBreakdown,
        whyThis: item.whyThis,
        compatibleWardrobeItems: item.compatibleWardrobeItems,
        filledGap: item.filledGap,
        applicableOffer: null,
        isSaved: false,
        isInCloset: false,
      };
    });

    return JSON.stringify({
      rankedCount: ranked.length,
      topRecommendations: ranked.map((r) => ({
        productId: r.productId,
        name: r.name,
        price: r.price,
        score: r.score,
        whyThis: r.whyThis,
        filledGap: r.filledGap?.label || null,
        compatibleCount: r.compatibleWardrobeItems.length,
      })),
    });
  },
  {
    name: 'rank_products',
    description:
      'Score and rank candidate products based on gap fulfillment, customer style preferences, closet compatibility, and browsing history. Returns top personalized recommendations.',
    schema: z.object({
      customerId: z.string().describe('The customer ID'),
      productIds: z.array(z.string()).describe('List of product IDs to rank'),
    }),
  }
);

// 8. check_offers
export const checkOffersTool = tool(
  async ({
    customerId,
    productIds,
  }: {
    customerId: string;
    productIds: string[];
  }) => {
    const wardrobe = await getWardrobeItems(customerId);
    const matchedOffers: any[] = [];

    for (const pid of productIds) {
      const [prod, offers] = await Promise.all([
        getProductById(pid),
        getProductOffers(pid),
      ]);

      if (!prod || !offers || offers.length === 0) continue;

      for (const offer of offers) {
        const validation = validateOfferConditions(offer, prod, wardrobe);
        if (validation.isEligible) {
          matchedOffers.push({
            offerId: offer.offerId,
            productId: pid,
            productName: prod.name,
            label: validation.label,
            discountPercentage: offer.discountPercentage,
            reason: validation.reason,
            validUntil: offer.validUntil,
          });
          break; // One best offer per product
        }
      }
    }

    return JSON.stringify({
      offersFoundCount: matchedOffers.length,
      offers: matchedOffers,
    });
  },
  {
    name: 'check_offers',
    description:
      'Check for active promotional discounts, bundle deals, and valid offers for specific products. Call when recommending products to buy or when user asks about deals/savings.',
    schema: z.object({
      customerId: z.string().describe('The customer ID'),
      productIds: z.array(z.string()).describe('List of product IDs to inspect for promotions'),
    }),
  }
);

// 9. generate_outfit
export const generateOutfitTool = tool(
  async ({
    customerId,
    occasion,
    season,
    maxBudget,
  }: {
    customerId: string;
    occasion?: string;
    season?: string;
    maxBudget?: number;
  }) => {
    const [customer, wardrobe] = await Promise.all([
      getCustomerProfile(customerId),
      getWardrobeItems(customerId),
    ]);

    const targetOccasion: Occasion =
      (occasion as Occasion) || customer?.preferredOccasions?.[0] || 'casual';
    const targetSeason: Season =
      (season as Season) || customer?.currentSeason || 'all-season';

    // Get a small pool of candidates if closet has missing slots
    const ownedProductIds = new Set(wardrobe.map((w) => w.productId).filter(Boolean) as string[]);
    const candidatePool = customer
      ? await getRecommendationCandidates(customer, ownedProductIds, undefined, maxBudget)
      : [];

    const outfit = generateOutfitLook(
      customerId,
      targetOccasion,
      targetSeason,
      wardrobe,
      candidatePool,
      maxBudget
    );

    const closetItemsCount = outfit.items.filter((i) => i.source === 'wardrobe').length;
    const recommendedCount = outfit.items.filter((i) => i.source === 'recommendation').length;

    return JSON.stringify({
      outfitId: outfit.outfitId,
      occasion: outfit.occasion,
      season: outfit.season,
      totalCost: outfit.totalCost,
      closetItemsCount,
      recommendedCount,
      missingItems: outfit.missingItems,
      items: outfit.items.map((i) => ({
        slot: i.slot,
        name: i.name,
        source: i.source,
        price: i.price,
      })),
    });
  },
  {
    name: 'generate_outfit',
    description:
      'Build a complete styled outfit look (tops, bottoms, shoes, outerwear/accessories) for a specific occasion and season. Combines owned wardrobe items with curated additions when necessary.',
    schema: z.object({
      customerId: z.string().describe('The customer ID'),
      occasion: z
        .enum(['casual', 'college', 'workwear', 'dateNight', 'weekend', 'party'])
        .nullable()
        .optional()
        .describe('Occasion to style for (e.g. casual, college, workwear, dateNight, weekend, party)'),
      season: z
        .enum(['summer', 'winter', 'monsoon', 'all-season'])
        .nullable()
        .optional()
        .describe('Season (summer, winter, monsoon, all-season)'),
      maxBudget: z.number().nullable().optional().describe('Maximum budget ceiling for missing items'),
    }),
  }
);

export const wardrobeIQTools = [
  getCustomerProfileTool,
  getWardrobeTool,
  analyzeWardrobeTool,
  detectWardrobeGapsTool,
  searchProductsTool,
  filterProductsTool,
  rankProductsTool,
  checkOffersTool,
  generateOutfitTool,
];
