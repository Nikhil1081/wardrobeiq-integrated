export type Category = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory' | 'traditional';
export type Occasion =
  | 'casual'
  | 'college'
  | 'workwear'
  | 'dateNight'
  | 'weekend'
  | 'party'
  | 'wedding'
  | 'festival'
  | 'formal'
  | 'travel';
export type Season = 'summer' | 'monsoon' | 'winter' | 'spring' | 'autumn' | 'tropical' | 'all-season';
export type Priority = 'very_high' | 'high' | 'medium' | 'low';
export type BrowsingEventType = 'viewed' | 'saved' | 'added_to_cart' | 'abandoned_cart';
export type FeedbackType = 'love' | 'not_for_me';
export type OfferType = 'bundle_discount' | 'percentage_off' | 'free_shipping' | 'seasonal_sale';
export type ConditionType = 'category_pair' | 'minimum_purchase' | 'none';

export interface UserDocument {
  _id?: any;
  userId: string;
  customerId?: string;
  email: string;
  passwordHash: string;
  name: string;
  avatar: string;
  role: 'user' | 'admin';
  country: string;
  region?: string;
  city?: string;
  climate?: string;
  preferredLanguage?: string;
  preferredStyles: string[];
  preferredColors: string[];
  avoidedColors: string[];
  budget: number;
  preferredOccasions: Occasion[];
  currentSeason: Season;
  themePreference: 'light' | 'dark' | 'system';
  createdAt: string;
  updatedAt: string;
}

export interface ProductDocument {
  _id?: any;
  productId: string;
  name: string;
  category: Category;
  subcategory: string;
  color: string;
  secondaryColor?: string;
  brand?: string;
  style?: string;
  styleTags: string[];
  material?: string;
  pattern?: string;
  occasion: Occasion[];
  season: Season[];
  weatherSuitability?: string[];
  price: number;
  originalPrice: number;
  store: string;
  imageUrl: string;
  backupImageUrl?: string;
  thumbnailUrl?: string;
  imageHash?: string;
  imageStatus?: 'verified' | 'duplicate_flagged' | 'broken_fallback';
  isTraditional?: boolean;
  country?: string;
  region?: string;
  description?: string;
  tags?: string[];
  available: boolean;
  createdAt: string;
}

export interface CustomerDocument {
  _id?: any;
  customerId: string;
  name: string;
  avatar: string;
  country?: string;
  region?: string;
  city?: string;
  climate?: string;
  preferredStyles: string[];
  preferredColors: string[];
  avoidedColors: string[];
  budget: number;
  preferredOccasions: Occasion[];
  currentSeason: Season;
  themePreference?: 'light' | 'dark' | 'system';
  createdAt: string;
  updatedAt: string;
}

export interface WardrobeDocument {
  _id?: any;
  itemId: string;
  customerId: string;
  productId?: string;
  name: string;
  category: Category;
  subcategory: string;
  color: string;
  secondaryColor?: string;
  brand?: string;
  style?: string;
  styleTags: string[];
  material?: string;
  pattern?: string;
  occasion: Occasion[];
  season: Season[];
  weatherSuitability?: string[];
  size?: string;
  fit?: string;
  formalityLevel?: string;
  isTraditional?: boolean;
  country?: string;
  region?: string;
  description?: string;
  tags?: string[];
  favorite?: boolean;
  price: number;
  store: string;
  imageUrl: string;
  backupImageUrl?: string;
  thumbnailUrl?: string;
  imageHash?: string;
  imageStatus?: 'verified' | 'duplicate_flagged' | 'broken_fallback';
  dateAcquired: string;
  pricePaid?: number;
  isCustom: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrowsingHistoryDocument {
  _id?: any;
  customerId: string;
  productId: string;
  eventType: BrowsingEventType;
  timestamp: string;
  viewCount: number;
}

export interface OfferDocument {
  _id?: any;
  offerId: string;
  productId: string;
  offerType: OfferType;
  discountPercentage: number;
  conditionType: ConditionType;
  conditionCategory?: Category;
  validUntil: string;
  minimumPurchase?: number;
  active: boolean;
}

export interface SavedItemDocument {
  _id?: any;
  customerId: string;
  productId: string;
  createdAt: string;
}

export interface OutfitItemReference {
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

export interface SavedOutfitDocument {
  _id?: any;
  customerId: string;
  outfitId: string;
  items: OutfitItemReference[];
  occasion: Occasion;
  caption: string;
  createdAt: string;
}

export interface FeedbackDocument {
  _id?: any;
  customerId: string;
  productId: string;
  type: FeedbackType;
  createdAt: string;
}

export interface OutfitHistoryDocument {
  _id?: any;
  customerId: string;
  outfitId: string;
  items: OutfitItemReference[];
  occasion: Occasion;
  season: Season;
  createdAt: string;
}

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AiConversationDocument {
  _id?: any;
  conversationId: string;
  customerId: string;
  messages: AiChatMessage[];
  createdAt: string;
  updatedAt: string;
}
