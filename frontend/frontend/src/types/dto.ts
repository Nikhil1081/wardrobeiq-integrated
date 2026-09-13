import { Category, Occasion, Season, Priority, OfferType, ConditionType, BrowsingEventType, FeedbackType } from './domain';

export interface ScoreBreakdownDTO {
  gapScore?: number;
  profileScore?: number;
  purchaseScore?: number;
  browsingScore?: number;
  seasonalScore?: number;
  styleScore?: number;
  gapRelevance?: number;        // 0-30
  styleCompatibility?: number;  // 0-20
  colorCompatibility?: number;  // 0-15
  occasionCompatibility?: number;// 0-15
  budgetCompatibility?: number; // 0-10
  seasonCompatibility?: number; // 0-10
  browsingBoost?: number;       // 0-15
  duplicatePenalty: number;    // -30 to 0
  finalScore: number;          // 0-100 (clamped)
}

export interface ProductCardDTO {
  productId: string;
  name: string;
  imageUrl: string;
  backupImageUrl?: string;
  isTraditional?: boolean;
  culturalOrigin?: string;
  category: Category;
  subcategory: string;
  color: string;
  styleTags: string[];
  occasion: Occasion[];
  season: Season[];
  price: number;
  originalPrice: number;
  discountPercentage: number;
  store: string;
  badges: string[];
  available: boolean;
  createdAt: string;
}

export interface OfferDTO {
  offerId: string;
  productId: string;
  offerType: OfferType;
  discountPercentage: number;
  discountedPrice: number;
  conditionType: ConditionType;
  conditionCategory?: Category;
  minimumPurchase?: number;
  validUntil: string;
  active: boolean;
  label: string;
  eligibilityMessage?: string;
}

export interface RecommendationDTO extends ProductCardDTO {
  score: number;
  scoreBreakdown: ScoreBreakdownDTO;
  whyThis: string;
  compatibleWardrobeItems: Array<{ itemId: string; name: string; category: Category; imageUrl: string }>;
  filledGap: { gapId: string; label: string; priority: Priority } | null;
  applicableOffer: OfferDTO | null;
  isSaved: boolean;
  isInCloset: boolean;
  browsingSignal?: { viewCount: number; lastEvent: string };
}

export interface WardrobeItemDTO {
  itemId: string;
  productId?: string;
  name: string;
  imageUrl: string;
  backupImageUrl?: string;
  isTraditional?: boolean;
  culturalOrigin?: string;
  category: Category;
  subcategory: string;
  color: string;
  styleTags: string[];
  occasion: Occasion[];
  season: Season[];
  price: number;
  store: string;
  dateAcquired: string;
  pricePaid?: number;
  isCustom: boolean;
}

export interface GapDTO {
  gapId: string;
  gapType: 'category' | 'occasion' | 'style' | 'season' | 'color_redundancy';
  label: string;
  category: Category;
  priority: Priority;
  priorityScore: number; // 0-100
  reason: string;
  supportingSignal: string;
  shortageMagnitude: number;
  preferredOccasionRelevance: number;
  seasonRelevance: number;
  browsingRelevance: number;
  outfitsUnlocked: number;
  compatibleOwnedItems: Array<{ itemId: string; name: string; category: Category; imageUrl: string }>;
}

export interface WardrobeHealthDTO {
  overallScore: number;       // 0-100
  versatility: number;        // 0-100
  colorBalance: number;       // 0-100
  occasionCoverage: number;   // 0-100
  seasonalCoverage: number;   // 0-100
}

export interface OutfitItemDTO {
  slot: Category;
  itemId: string;
  productId?: string;
  name: string;
  imageUrl: string;
  category: Category;
  price: number;
  source: 'wardrobe' | 'recommendation';
  locked: boolean;
}

export interface OutfitDTO {
  outfitId: string;
  name?: string;
  occasion: Occasion;
  season: Season;
  items: OutfitItemDTO[];
  coverage?: number; // 0-100
  caption?: string;
  rationale?: string;
  totalCost: number;
  missingItems?: Category[];
  compatibilityScore?: number; // 0-100
  createdAt?: string;
}

export interface CustomerDTO {
  customerId: string;
  name: string;
  avatar: string;
  country?: string;
  city?: string;
  climate?: string;
  preferredStyles: string[];
  preferredColors: string[];
  avoidedColors: string[];
  budget: number;
  preferredOccasions: Occasion[];
  currentSeason: Season;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityDTO {
  id: string;
  type: 'closet_add' | 'gap_detected' | 'offer_applied' | 'browsing' | 'recommendation';
  title: string;
  timestamp: string;
}

export interface DashboardDTO {
  customer: CustomerDTO;
  greeting: string;
  profileSummary: {
    budgetLabel: string;
    dominantStyle: string;
    activeSeason: string;
  };
  wardrobeStatistics: {
    totalItems: number;
    categoryCounts: Record<Category, number>;
    dominantColors: string[];
    dominantStyles: string[];
    occasionCoverage: Record<Occasion, number>;
    colorDiversity: number;
    topCategory: Category;
    weakestCategory: Category;
    browsingSignals?: { totalEvents: number; topViewedCategory?: Category };
  };
  wardrobeHealth: WardrobeHealthDTO;
  topWardrobeGaps: GapDTO[];
  priorityGaps: GapDTO[];
  recommendedProducts: RecommendationDTO[];
  recommendedOutfits: OutfitDTO[];
  recentActivity: ActivityDTO[];
  savedCount: number;
  outfitCount: number;
}

export interface WhyThisDTO {
  productId: string;
  productName: string;
  gapFilled: string | null;
  wardrobeCompatibility: string;
  compatibleItems: Array<{ itemId: string; name: string; category: Category }>;
  styleReason: string;
  colorReason: string;
  occasionReason: string;
  seasonReason: string;
  budgetReason: string;
  browsingReason: string;
  offerReason?: string;
  scoreBreakdown: ScoreBreakdownDTO;
}

export interface AIStylistResponseDTO {
  message: string;
  recommendations: RecommendationDTO[];
  outfits: OutfitDTO[];
  gaps: GapDTO[];
  conversationId: string;
  processingSteps: string[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PurchaseDTO {
  purchaseId: string;
  customerId: string;
  productId: string;
  productName: string;
  category: Category;
  subcategory?: string;
  pricePaid: number;
  store: string;
  purchaseDate: string;
  orderId?: string;
  rating?: number;
  createdAt?: string;
}

export interface BrowsingInteractionDTO {
  interactionId: string;
  customerId: string;
  eventType: BrowsingEventType;
  productId?: string;
  productName?: string;
  category?: Category;
  searchQuery?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface AdminUserDTO {
  userId: string;
  email: string;
  name: string;
  role: 'user' | 'demo' | 'admin';
  customerId?: string;
  country?: string;
  city?: string;
  preferredStyles?: string[];
  themePreference?: 'light' | 'dark' | 'system';
  createdAt: string;
}

export interface AdminDashboardDTO {
  counts: {
    products: number;
    personas: number;
    wardrobeItems: number;
    purchases: number;
    browsingEvents: number;
    users: number;
  };
  metrics: {
    totalWardrobeValue: number;
    totalGMV: number;
    averageOrderValue: number;
    purchasesPerCustomer: number;
  };
  wardrobeCategoryBreakdown: Record<Category, number>;
  productCategoryBreakdown: Record<Category, number>;
}

