import customersData from '../data/customers.json';
import productsData from '../data/products.json';
import {
  CustomerDTO,
  ProductCardDTO,
  WardrobeItemDTO,
  RecommendationDTO,
  DashboardDTO,
  GapDTO,
  AdminDashboardDTO,
  PaginatedResult,
} from '../types/dto';
import { Category, Occasion, Season } from '../types/domain';

export const fallbackCustomers: CustomerDTO[] = (customersData as any[]).map((c) => ({
  ...c,
  preferredStyles: c.preferredStyles || ['smart-casual'],
  preferredColors: c.preferredColors || ['black', 'white'],
  avoidedColors: c.avoidedColors || [],
  preferredOccasions: c.preferredOccasions || ['casual'],
  currentSeason: c.currentSeason || 'all-season',
}));

export const fallbackProducts: ProductCardDTO[] = (productsData as any[]).map((p) => ({
  ...p,
  originalPrice: p.originalPrice || p.price,
  discountPercentage: p.discountPercentage || 0,
  badges: p.badges || [],
  createdAt: p.createdAt || '2025-01-01',
  available: p.available !== false,
}));

export function getFallbackCloset(customerId: string): { customerId: string; items: WardrobeItemDTO[]; totalCount: number } {
  const customer = fallbackCustomers.find((c) => c.customerId === customerId) || fallbackCustomers[0];
  const custNum = parseInt(customer.customerId.replace(/\D/g, '') || '1', 10);
  
  const items: WardrobeItemDTO[] = fallbackProducts.slice(0, 105).map((p, idx) => ({
    itemId: `w_${customerId}_${idx}`,
    productId: p.productId,
    name: p.name,
    category: p.category,
    subcategory: p.subcategory || 'Standard',
    color: p.color,
    styleTags: p.styleTags,
    occasion: p.occasion,
    season: p.season,
    price: p.price,
    store: p.store,
    imageUrl: p.imageUrl,
    wearCount: ((custNum * 7 + idx * 3) % 25) + 1,
    costPerWear: Math.round(p.price / (((custNum * 7 + idx * 3) % 25) + 1)),
    lastWorn: new Date(Date.now() - ((idx * 86400000 * 2) % (90 * 86400000))).toISOString().split('T')[0],
    isCustom: false,
    dateAcquired: '2025-06-01',
  }));

  return {
    customerId,
    items,
    totalCount: items.length,
  };
}

export function getFallbackExplore(params?: {
  category?: string;
  style?: string;
  occasion?: string;
  season?: string;
  search?: string;
  page?: number;
  limit?: number;
}): PaginatedResult<ProductCardDTO> {
  let list = [...fallbackProducts];

  if (params?.category && params.category !== 'all') {
    list = list.filter((p) => p.category === params.category);
  }
  if (params?.style) {
    list = list.filter((p) => p.styleTags?.includes(params.style as any));
  }
  if (params?.occasion) {
    list = list.filter((p) => p.occasion?.includes(params.occasion as any));
  }
  if (params?.season) {
    list = list.filter((p) => p.season?.includes(params.season as any));
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.color?.toLowerCase().includes(q) ||
        p.styleTags?.some((s) => s.toLowerCase().includes(q))
    );
  }

  const page = params?.page || 1;
  const limit = params?.limit || 24;
  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const items = list.slice(start, start + limit);

  return {
    items,
    total,
    page,
    limit,
    totalPages,
  };
}

export function getFallbackRecommendations(customerId: string): { customerId: string; recommendations: RecommendationDTO[] } {
  const customer = fallbackCustomers.find((c) => c.customerId === customerId) || fallbackCustomers[0];
  const preferredStyles = customer.preferredStyles || ['smart-casual'];

  const recs: RecommendationDTO[] = fallbackProducts
    .filter((p) => p.styleTags?.some((s) => preferredStyles.includes(s)))
    .slice(0, 16)
    .map((p, idx) => ({
      ...p,
      score: 92 - idx * 2,
      scoreBreakdown: {
        gapScore: 28,
        profileScore: 20,
        purchaseScore: 15,
        browsingScore: 11,
        seasonalScore: 9,
        styleScore: 9,
        duplicatePenalty: 0,
        finalScore: 92 - idx * 2,
      },
      matchReason: `Aligns with your ${preferredStyles[0] || 'casual'} style and pairs with your weekly wardrobe rotation.`,
      tags: p.styleTags || [],
    } as unknown as RecommendationDTO));

  return { customerId, recommendations: recs };
}

export function getFallbackHomeDashboard(customerId: string): DashboardDTO {
  const customer = fallbackCustomers.find((c) => c.customerId === customerId) || fallbackCustomers[0];
  const closet = getFallbackCloset(customerId);
  const recs = getFallbackRecommendations(customerId);

  const gaps: GapDTO[] = [
    {
      gapId: 'gap_1',
      gapType: 'category',
      label: 'Outerwear Layering Gap',
      category: 'outerwear',
      priority: 'high',
      priorityScore: 85,
      reason: 'Only light layers currently available in this category for changing weather.',
      supportingSignal: 'Wardrobe audit identifies shortage in water-resistant/warm outer layer.',
      shortageMagnitude: 2,
      preferredOccasionRelevance: 80,
      seasonRelevance: 90,
      browsingRelevance: 75,
      outfitsUnlocked: 6,
      compatibleOwnedItems: closet.items.slice(0, 3).map((item) => ({
        itemId: item.itemId,
        name: item.name,
        category: item.category,
        imageUrl: item.imageUrl,
      })),
    },
    {
      gapId: 'gap_2',
      gapType: 'occasion',
      label: 'Smart Footwear Gap',
      category: 'shoes',
      priority: 'medium',
      priorityScore: 72,
      reason: 'Rotation lacks formal leather or evening footwear options.',
      supportingSignal: 'Frequent workwear and dinner occasion settings detected.',
      shortageMagnitude: 1,
      preferredOccasionRelevance: 85,
      seasonRelevance: 70,
      browsingRelevance: 60,
      outfitsUnlocked: 4,
      compatibleOwnedItems: closet.items.slice(3, 6).map((item) => ({
        itemId: item.itemId,
        name: item.name,
        category: item.category,
        imageUrl: item.imageUrl,
      })),
    },
  ];

  return {
    customer,
    greeting: `Welcome back, ${customer.name}`,
    profileSummary: {
      budgetLabel: `₹${customer.budget} budget`,
      dominantStyle: customer.preferredStyles[0] || 'smart-casual',
      activeSeason: customer.currentSeason || 'all-season',
    },
    wardrobeStatistics: {
      totalItems: closet.totalCount,
      categoryCounts: {
        top: 25,
        bottom: 20,
        dress: 15,
        outerwear: 15,
        shoes: 10,
        accessory: 10,
        traditional: 10,
      },
      dominantColors: ['black', 'navy', 'white', 'beige'],
      dominantStyles: customer.preferredStyles,
      occasionCoverage: {
        casual: 90,
        workwear: 80,
        dateNight: 75,
        college: 85,
        weekend: 95,
        festival: 70,
        wedding: 65,
        travel: 80,
        party: 75,
        formal: 80,
      },
      colorDiversity: 82,
      topCategory: 'top',
      weakestCategory: 'shoes',
      browsingSignals: { totalEvents: 52, topViewedCategory: 'outerwear' },
    },
    wardrobeHealth: {
      overallScore: 88,
      versatility: 85,
      colorBalance: 82,
      occasionCoverage: 80,
      seasonalCoverage: 84,
    },
    topWardrobeGaps: gaps,
    priorityGaps: gaps,
    recommendedProducts: recs.recommendations.slice(0, 6),
    recommendedOutfits: [],
    recentActivity: [
      {
        id: 'act_1',
        type: 'browsing',
        title: 'Viewed curated outerwear collection',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'act_2',
        type: 'recommendation',
        title: 'New complementary pairing generated',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
    savedCount: 3,
    outfitCount: 2,
  };
}

export function getFallbackAdminDashboard(): AdminDashboardDTO {
  return {
    counts: {
      products: 812,
      personas: 105,
      wardrobeItems: 73500,
      purchases: 4095,
      browsingEvents: 5195,
      users: 106,
    },
    metrics: {
      totalWardrobeValue: 18450000,
      totalGMV: 24500000,
      averageOrderValue: 5980,
      purchasesPerCustomer: 39,
    },
    wardrobeCategoryBreakdown: {
      top: 10500,
      bottom: 10500,
      dress: 10500,
      outerwear: 10500,
      shoes: 10500,
      accessory: 10500,
      traditional: 10500,
    },
    productCategoryBreakdown: {
      top: 116,
      bottom: 116,
      dress: 116,
      outerwear: 116,
      shoes: 116,
      accessory: 116,
      traditional: 116,
    },
  };
}
