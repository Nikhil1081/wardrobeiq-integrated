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
  PurchaseDTO,
  BrowsingInteractionDTO,
  AdminUserDTO,
  OutfitDTO,
} from '../types/dto';
import { Category, Occasion, Season, BrowsingEventType } from '../types/domain';

export interface DemoPersona {
  userId: string;
  customerId: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  country: string;
  styles: string[];
}

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

export const fallbackDemoPersonas: DemoPersona[] = [
  {
    userId: 'admin_root',
    customerId: 'admin_root',
    name: 'WardrobeIQ Administrator',
    email: 'admin@wardrobeiq.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    role: 'admin',
    country: 'Global',
    styles: ['smart-casual', 'minimalist'],
  },
  ...fallbackCustomers.map((c) => ({
    userId: c.customerId,
    customerId: c.customerId,
    name: c.name,
    email: `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@wardrobeiq.demo`,
    avatar: c.avatar,
    role: 'user',
    country: c.country || 'Global',
    styles: c.preferredStyles,
  })),
];

// Pre-group products by category for lightning-fast wardrobe generation (116 products per category)
const productsByCategory: Record<Category, ProductCardDTO[]> = {
  top: fallbackProducts.filter((p) => p.category === 'top'),
  bottom: fallbackProducts.filter((p) => p.category === 'bottom'),
  dress: fallbackProducts.filter((p) => p.category === 'dress'),
  outerwear: fallbackProducts.filter((p) => p.category === 'outerwear'),
  shoes: fallbackProducts.filter((p) => p.category === 'shoes'),
  accessory: fallbackProducts.filter((p) => p.category === 'accessory'),
  traditional: fallbackProducts.filter((p) => p.category === 'traditional'),
};

const ALL_CATEGORIES: Category[] = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'traditional'];

export function getFallbackCloset(
  customerId: string,
  params?: { category?: string; occasion?: string; season?: string; search?: string }
): { customerId: string; items: WardrobeItemDTO[]; totalCount: number; categoryBreakdown: Record<Category, number> } {
  const customer = fallbackCustomers.find((c) => c.customerId === customerId) || fallbackCustomers[0];
  const custNum = parseInt(customer.customerId.replace(/\D/g, '') || '1', 10);

  const fullCloset: WardrobeItemDTO[] = [];
  const categoryBreakdown: Record<Category, number> = {
    top: 10,
    bottom: 10,
    dress: 10,
    outerwear: 10,
    shoes: 10,
    accessory: 10,
    traditional: 10,
  };

  ALL_CATEGORIES.forEach((cat) => {
    const catPool = productsByCategory[cat] || [];
    if (catPool.length === 0) return;

    for (let i = 0; i < 10; i++) {
      const pIdx = (custNum * 13 + i) % catPool.length;
      const p = catPool[pIdx];
      const wearCount = ((custNum * 7 + i * 3) % 25) + 1;
      const daysAgo = (custNum * 17 + i * 9) % 120;

      fullCloset.push({
        itemId: `w_${customerId}_${cat}_${i + 1}`,
        productId: p.productId,
        name: p.name,
        category: cat,
        subcategory: p.subcategory || 'Standard',
        color: p.color,
        styleTags: p.styleTags,
        occasion: p.occasion,
        season: p.season,
        price: p.price,
        store: p.store,
        imageUrl: p.imageUrl,
        isCustom: false, dateAcquired: '2025-06-01',
      });
    }
  });

  let items = fullCloset;

  if (params?.category && params.category !== 'all') {
    items = items.filter((item) => item.category === params.category);
  }
  if (params?.occasion && params.occasion !== 'all') {
    items = items.filter((item) => item.occasion?.includes(params.occasion as any));
  }
  if (params?.season && params.season !== 'all') {
    items = items.filter((item) => item.season?.includes(params.season as any));
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.subcategory.toLowerCase().includes(q) ||
        item.color.toLowerCase().includes(q)
    );
  }

  return {
    customerId,
    items,
    totalCount: fullCloset.length,
    categoryBreakdown,
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

  let matched = fallbackProducts.filter((p) => p.styleTags?.some((s) => preferredStyles.includes(s)));
  if (matched.length < 16) {
    matched = [...matched, ...fallbackProducts.slice(0, 20)];
  }

  const recs: RecommendationDTO[] = matched.slice(0, 16).map((p, idx) => ({
    ...p,
    score: Math.max(70, 95 - idx * 2),
    scoreBreakdown: {
      gapScore: 28,
      profileScore: 20,
      purchaseScore: 15,
      browsingScore: 11,
      seasonalScore: 9,
      styleScore: 9,
      duplicatePenalty: 0,
      finalScore: Math.max(70, 95 - idx * 2),
    },
    matchReason: `Aligns with your ${preferredStyles[0] || 'casual'} style and pairs with your weekly wardrobe rotation.`,
    tags: p.styleTags || [],
  } as unknown as RecommendationDTO));

  return { customerId, recommendations: recs };
}

export function getFallbackGaps(customerId: string): GapDTO[] {
  const customer = fallbackCustomers.find((c) => c.customerId === customerId) || fallbackCustomers[0];
  const closet = getFallbackCloset(customerId);
  const styles = customer.preferredStyles || ['smart-casual'];

  return [
    {
      gapId: `gap_${customerId}_outerwear`,
      gapType: 'category',
      label: 'Weather & Layering Outerwear Gap',
      category: 'outerwear',
      priority: 'high',
      priorityScore: 88,
      reason: `Your wardrobe needs weather-appropriate layering pieces in ${customer.climate || 'moderate'} climate.`,
      supportingSignal: `Deficit detected in versatile outerwear matching your ${styles.join(', ')} aesthetic.`,
      shortageMagnitude: 2,
      preferredOccasionRelevance: 85,
      seasonRelevance: 90,
      browsingRelevance: 80,
      outfitsUnlocked: 8,
      compatibleOwnedItems: closet.items.slice(0, 3).map((i) => ({
        itemId: i.itemId,
        name: i.name,
        category: i.category,
        imageUrl: i.imageUrl,
      })),
    },
    {
      gapId: `gap_${customerId}_traditional`,
      gapType: 'occasion',
      label: 'Celebration & Festival Deficit',
      category: 'traditional',
      priority: 'very_high',
      priorityScore: 92,
      reason: 'Upcoming festival and cultural occasions require tailored ethnic ensembles.',
      supportingSignal: 'High occasion demand with limited statement silhouettes.',
      shortageMagnitude: 2,
      preferredOccasionRelevance: 95,
      seasonRelevance: 85,
      browsingRelevance: 75,
      outfitsUnlocked: 6,
      compatibleOwnedItems: closet.items.slice(3, 6).map((i) => ({
        itemId: i.itemId,
        name: i.name,
        category: i.category,
        imageUrl: i.imageUrl,
      })),
    },
    {
      gapId: `gap_${customerId}_smart_shoes`,
      gapType: 'category',
      label: 'Smart Occasion Footwear Gap',
      category: 'shoes',
      priority: 'medium',
      priorityScore: 74,
      reason: 'Rotation lacks elevated footwear for formal and evening dinners.',
      supportingSignal: 'Pairs with 12 existing trousers and dresses.',
      shortageMagnitude: 1,
      preferredOccasionRelevance: 80,
      seasonRelevance: 70,
      browsingRelevance: 65,
      outfitsUnlocked: 12,
      compatibleOwnedItems: closet.items.slice(6, 9).map((i) => ({
        itemId: i.itemId,
        name: i.name,
        category: i.category,
        imageUrl: i.imageUrl,
      })),
    },
  ];
}

export function getFallbackSavedItems(customerId: string): { savedProducts: RecommendationDTO[]; savedOutfits: OutfitDTO[] } {
  const recs = getFallbackRecommendations(customerId).recommendations;
  return {
    savedProducts: recs.slice(0, 3),
    savedOutfits: [],
  };
}

export function getFallbackHomeDashboard(customerId: string): DashboardDTO {
  const customer = fallbackCustomers.find((c) => c.customerId === customerId) || fallbackCustomers[0];
  const recs = getFallbackRecommendations(customerId);
  const gaps = getFallbackGaps(customerId);

  return {
    customer,
    greeting: `Welcome back, ${customer.name}`,
    profileSummary: {
      budgetLabel: `₹${customer.budget} budget`,
      dominantStyle: customer.preferredStyles[0] || 'smart-casual',
      activeSeason: customer.currentSeason || 'all-season',
    },
    wardrobeStatistics: {
      totalItems: 70,
      categoryCounts: {
        top: 10,
        bottom: 10,
        dress: 10,
        outerwear: 10,
        shoes: 10,
        accessory: 10,
        traditional: 10,
      },
      dominantColors: ['black', 'navy', 'white', 'beige'],
      dominantStyles: customer.preferredStyles,
      occasionCoverage: {
        casual: 95,
        workwear: 90,
        dateNight: 85,
        college: 90,
        weekend: 95,
        festival: 85,
        wedding: 80,
        travel: 85,
        party: 85,
        formal: 90,
      },
      colorDiversity: 92,
      topCategory: 'top',
      weakestCategory: 'outerwear',
      browsingSignals: { totalEvents: 52, topViewedCategory: 'outerwear' },
    },
    wardrobeHealth: {
      overallScore: 91,
      versatility: 88,
      colorBalance: 86,
      occasionCoverage: 89,
      seasonalCoverage: 90,
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

export function getFallbackExploreCollections() {
  const collections = [
    { key: 'trending', title: 'Trending Now', subtitle: 'Pieces capturing current season buzz and customer styling interest.', heroImage: fallbackProducts[1].imageUrl, tag: 'Trending', category: 'top' as Category },
    { key: 'seasonal', title: 'Seasonal Edit', subtitle: 'Breathable, sun-drenched palettes and lightweight linen cuts.', heroImage: fallbackProducts[120].imageUrl, tag: 'Summer', category: 'dress' as Category },
    { key: 'college', title: 'College Style', subtitle: 'Effortless relaxed shirts, denim, and sneakers for campus life.', heroImage: fallbackProducts[240].imageUrl, tag: 'Campus', category: 'bottom' as Category },
    { key: 'minimal', title: 'Minimal Edit', subtitle: 'Understated neutrals, sharp lines, and quiet luxury tailoring.', heroImage: fallbackProducts[360].imageUrl, tag: 'Minimalist', category: 'outerwear' as Category },
    { key: 'weekend', title: 'Weekend Looks', subtitle: 'Off-duty elegance for Saturday brunches and travel ease.', heroImage: fallbackProducts[480].imageUrl, tag: 'Weekend', category: 'shoes' as Category },
    { key: 'dateNight', title: 'Date Night', subtitle: 'Evening glamour, elevated monochrome tones, and refined silks.', heroImage: fallbackProducts[600].imageUrl, tag: 'Evening', category: 'top' as Category },
    { key: 'workwear', title: 'Workwear', subtitle: 'Structured blazers, pleated trousers, and crisp tailored shirts.', heroImage: fallbackProducts[720].imageUrl, tag: 'Professional', category: 'outerwear' as Category },
    { key: 'traditional', title: 'Festive & Heritage', subtitle: 'Rich silk lehengas, embroidered kurtas, and handcrafted textiles.', heroImage: fallbackProducts[800].imageUrl, tag: 'Heritage', category: 'traditional' as Category },
  ];

  return collections.map((col) => {
    const prods = (productsByCategory[col.category] || []).slice(0, 8);
    return {
      collectionId: col.key,
      title: col.title,
      subtitle: col.subtitle,
      heroImage: col.heroImage,
      tags: [col.tag],
      products: prods.length > 0 ? prods : fallbackProducts.slice(0, 8),
    };
  });
}

export function getFallbackAdminDashboard(): AdminDashboardDTO {
  return {
    counts: {
      products: 812,
      personas: 105,
      wardrobeItems: 7350,
      purchases: 4095,
      browsingEvents: 5195,
      users: 106,
    },
    metrics: {
      totalWardrobeValue: 1845000,
      totalGMV: 24500000,
      averageOrderValue: 5980,
      purchasesPerCustomer: 39,
    },
    wardrobeCategoryBreakdown: {
      top: 1050,
      bottom: 1050,
      dress: 1050,
      outerwear: 1050,
      shoes: 1050,
      accessory: 1050,
      traditional: 1050,
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

export function getFallbackClothing(params?: any): PaginatedResult<WardrobeItemDTO> {
  const customerId = params?.customerId || 'C001';
  const closet = getFallbackCloset(customerId);
  let list = closet.items;
  if (params?.category && params.category !== 'all') {
    list = list.filter((i) => i.category === params.category);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    list = list.filter((i) => i.name.toLowerCase().includes(q) || i.color.toLowerCase().includes(q));
  }
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const total = 7350;
  const totalPages = Math.ceil(total / limit);
  const items = list.slice(((page - 1) % 14) * limit, ((page - 1) % 14 + 1) * limit);
  return { items, total, page, limit, totalPages };
}

export function getFallbackPurchases(params?: any): PaginatedResult<PurchaseDTO> {
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const total = 4095;
  const totalPages = Math.ceil(total / limit);
  const items: PurchaseDTO[] = Array.from({ length: limit }).map((_, idx) => {
    const pIdx = ((page * limit + idx) * 7) % fallbackProducts.length;
    const cIdx = ((page * limit + idx) * 3) % fallbackCustomers.length;
    const p = fallbackProducts[pIdx];
    const c = fallbackCustomers[cIdx];
    return {
      purchaseId: `PUR_${page * limit + idx}`,
      customerId: c.customerId,
      productId: p.productId,
      productName: p.name,
      category: p.category,
      pricePaid: p.price,
      store: p.store,
      purchaseDate: new Date(Date.now() - idx * 86400000 * 2).toISOString().split('T')[0],
    };
  });
  return { items, total, page, limit, totalPages };
}

export function getFallbackBrowsing(params?: any): PaginatedResult<BrowsingInteractionDTO> {
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const total = 5195;
  const totalPages = Math.ceil(total / limit);
  const eventTypes: Array<BrowsingEventType> = ['VIEW', 'CLICK', 'SEARCH', 'viewed', 'saved', 'added_to_cart'];
  const items: BrowsingInteractionDTO[] = Array.from({ length: limit }).map((_, idx) => {
    const pIdx = ((page * limit + idx) * 5) % fallbackProducts.length;
    const cIdx = ((page * limit + idx) * 11) % fallbackCustomers.length;
    const p = fallbackProducts[pIdx];
    const c = fallbackCustomers[cIdx];
    return {
      interactionId: `INT_${page * limit + idx}`,
      customerId: c.customerId,
      productId: p.productId,
      productName: p.name,
      category: p.category,
      eventType: eventTypes[idx % eventTypes.length],
      timestamp: new Date(Date.now() - idx * 3600000).toISOString(),
      metadata: { dwellTimeSeconds: 15 + (idx % 120) },
    };
  });
  return { items, total, page, limit, totalPages };
}

export function getFallbackUsers(): AdminUserDTO[] {
  return [
    {
      userId: 'admin_root',
      name: 'WardrobeIQ Administrator',
      email: 'admin@wardrobeiq.com',
      role: 'admin' as const,
      country: 'Global',
      createdAt: '2025-01-01',
    },
    ...fallbackCustomers.map((c) => ({
      userId: c.customerId,
      name: c.name,
      email: `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@wardrobeiq.demo`,
      role: 'user' as const,
      country: c.country || 'Global',
      createdAt: '2025-01-15',
    })),
  ];
}

export function getFallbackAudit(): any {
  return {
    status: 'OPTIMAL',
    timestamp: new Date().toISOString(),
    dimensions: {
      personas: { count: 105, target: 105, valid: true },
      wardrobes: { count: 7350, target: 7350, valid: true },
      products: { count: 812, target: 812, valid: true },
      images: { uniqueCount: 812, sharedCount: 0, valid: true },
      purchases: { count: 4095, valid: true },
      browsingHistory: { count: 5195, valid: true },
    },
    legacyRecordsRemoved: 0,
    customItemStorageValid: true,
    recommendationEngineStatus: 'OPERATIONAL',
  };
}

export function authenticateFallbackUser(email: string, pass?: string): { user: any; token: string } {
  const norm = (email || '').trim().toLowerCase();

  if (norm.includes('admin')) {
    const admin = fallbackDemoPersonas[0];
    return {
      user: {
        userId: admin.userId,
        customerId: admin.userId,
        email: admin.email,
        name: admin.name,
        avatar: admin.avatar,
        role: 'admin',
        country: admin.country,
        preferredStyles: admin.styles,
      },
      token: `demo_token_admin_${Date.now()}`,
    };
  }

  const matched =
    fallbackDemoPersonas.find(
      (p) =>
        p.userId.toLowerCase() === norm ||
        p.email.toLowerCase() === norm ||
        p.name.toLowerCase().includes(norm)
    ) || fallbackDemoPersonas[1];

  return {
    user: {
      userId: matched.userId,
      customerId: matched.userId,
      email: matched.email,
      name: matched.name,
      avatar: matched.avatar,
      role: 'user',
      country: matched.country,
      preferredStyles: matched.styles,
    },
    token: `demo_token_${matched.userId}_${Date.now()}`,
  };
}

export function registerFallbackUser(data: any): { user: any; token: string } {
  const tempId = `usr_${Date.now()}`;
  return {
    user: {
      userId: tempId,
      customerId: tempId,
      email: data.email,
      name: data.name,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      role: data.email?.includes('admin') ? 'admin' : 'user',
      country: data.country || 'India',
      city: data.city || 'Mumbai',
      preferredStyles: data.preferredStyles || ['smart-casual'],
    },
    token: `demo_token_${tempId}`,
  };
}

export function getFallbackStylistResponse(customerId: string, message: string): any {
  const isAdm = customerId === 'admin_root' || customerId === 'admin';
  const customer = isAdm
    ? { name: 'WardrobeIQ Administrator', preferredStyles: ['smart-casual', 'minimalist', 'classic'] }
    : fallbackCustomers.find((c) => c.customerId === customerId) || fallbackCustomers[0];

  const recsData = getFallbackRecommendations(isAdm ? 'C001' : customerId);
  const gaps = getFallbackGaps(isAdm ? 'C001' : customerId);
  const topRec = recsData.recommendations[0];
  const name = customer.name.split(' ')[0] || 'there';

  const reply = `Hi ${name}! I reviewed your closet and styling preferences. I recommend adding **${topRec?.name || 'Classic Cotton Oxford Shirt'}** (₹${topRec?.price || 1900}), which fills a key styling gap in your collection. It pairs seamlessly with your weekly wardrobe pieces and complements your ${customer.preferredStyles?.[0] || 'smart-casual'} look.`;

  return {
    message: reply,
    recommendations: recsData.recommendations.slice(0, 3),
    gaps: gaps.slice(0, 1),
    outfits: [],
    conversationId: `conv_${Date.now()}`,
    processingSteps: [
      'Understanding request',
      'Checking your closet',
      'Detecting wardrobe gaps',
      'Finding compatible pieces',
      'Ranking recommendations',
      'Building your look',
    ],
  };
}
