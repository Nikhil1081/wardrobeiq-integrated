export type Category = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory' | 'traditional';
export type Occasion = 'casual' | 'college' | 'workwear' | 'dateNight' | 'weekend' | 'party' | 'wedding' | 'festival' | 'formal' | 'travel';
export type Season = 'summer' | 'monsoon' | 'winter' | 'spring' | 'autumn' | 'tropical' | 'all-season';
export type Priority = 'very_high' | 'high' | 'medium' | 'low';
export type BrowsingEventType = 'viewed' | 'saved' | 'added_to_cart' | 'abandoned_cart';
export type FeedbackType = 'love' | 'not_for_me';
export type OfferType = 'bundle_discount' | 'percentage_off' | 'free_shipping' | 'seasonal_sale';
export type ConditionType = 'category_pair' | 'minimum_purchase' | 'none';

export interface ProductDocument {
  _id?: any;
  productId: string;
  name: string;
  category: Category;
  subcategory: string;
  color: string;
  styleTags: string[];
  occasion: Occasion[];
  season: Season[];
  price: number;
  originalPrice: number;
  store: string;
  imageUrl: string;
  backupImageUrl?: string;
  isTraditional?: boolean;
  culturalOrigin?: string;
  available: boolean;
  createdAt: string;
}

export interface CustomerDocument {
  _id?: any;
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
  styleTags: string[];
  occasion: Occasion[];
  season: Season[];
  price: number;
  store: string;
  imageUrl: string;
  dateAcquired: string;
  pricePaid?: number;
  isCustom: boolean;
  createdAt?: string;
  updatedAt?: string;
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
