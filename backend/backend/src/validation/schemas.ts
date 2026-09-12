import { z } from 'zod';

export const CategoryEnum = z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory']);
export const OccasionEnum = z.enum(['casual', 'college', 'workwear', 'dateNight', 'weekend', 'party']);
export const SeasonEnum = z.enum(['summer', 'monsoon', 'winter', 'all-season']);
export const PriorityEnum = z.enum(['very_high', 'high', 'medium', 'low']);
export const BrowsingEventTypeEnum = z.enum(['viewed', 'saved', 'added_to_cart', 'abandoned_cart']);
export const FeedbackTypeEnum = z.enum(['love', 'not_for_me']);
export const OfferTypeEnum = z.enum(['bundle_discount', 'percentage_off', 'free_shipping', 'seasonal_sale']);
export const ConditionTypeEnum = z.enum(['category_pair', 'minimum_purchase', 'none']);

// Customer Schemas
export const CustomerIdParamSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
});

export const CustomerUpdateSchema = z.object({
  preferredStyles: z.array(z.string().min(1)).optional(),
  preferredColors: z.array(z.string().min(1)).optional(),
  avoidedColors: z.array(z.string().min(1)).optional(),
  budget: z.number().positive('Budget must be positive').optional(),
  preferredOccasions: z.array(OccasionEnum).optional(),
  currentSeason: SeasonEnum.optional(),
});

// Wardrobe Item Schemas
export const WardrobeAddSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  category: CategoryEnum,
  subcategory: z.string().min(1, 'Subcategory is required'),
  color: z.string().min(1, 'Color is required'),
  styleTags: z.array(z.string()).default([]),
  occasion: z.array(OccasionEnum).min(1, 'At least one occasion required'),
  season: z.array(SeasonEnum).min(1, 'At least one season required'),
  price: z.number().nonnegative('Price must be non-negative'),
  store: z.string().default('Personal Closet'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isCustom: z.boolean().default(false),
  dateAcquired: z.string().optional(),
  pricePaid: z.number().optional(),
});

export const WardrobeUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  category: CategoryEnum.optional(),
  subcategory: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  styleTags: z.array(z.string()).optional(),
  occasion: z.array(OccasionEnum).optional(),
  season: z.array(SeasonEnum).optional(),
  price: z.number().nonnegative().optional(),
  store: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isCustom: z.boolean().optional(),
  dateAcquired: z.string().optional(),
  pricePaid: z.number().optional(),
});

export const WardrobeQuerySchema = z.object({
  search: z.string().optional(),
  category: CategoryEnum.optional(),
  subcategory: z.string().optional(),
  color: z.string().optional(),
  style: z.string().optional(),
  occasion: OccasionEnum.optional(),
  season: SeasonEnum.optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'name']).default('newest'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

// Product Query Schemas
export const ProductQuerySchema = z.object({
  search: z.string().optional(),
  category: CategoryEnum.optional(),
  subcategory: z.string().optional(),
  color: z.string().optional(),
  style: z.string().optional(),
  occasion: OccasionEnum.optional(),
  season: SeasonEnum.optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  store: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  page: z.coerce.number().int().positive().default(1),
});

// Recommendation Request Schema
export const RecommendationRequestSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  query: z.string().optional(),
  category: CategoryEnum.optional(),
  occasion: OccasionEnum.optional(),
  season: SeasonEnum.optional(),
  budget: z.number().positive().optional(),
  maxBudget: z.number().positive().optional(),
  color: z.string().optional(),
  style: z.string().optional(),
  limit: z.coerce.number().optional(),
  browsingBoost: z.boolean().optional(),
  filters: z
    .object({
      category: CategoryEnum.optional(),
      occasion: OccasionEnum.optional(),
      season: SeasonEnum.optional(),
      maxBudget: z.number().positive().optional(),
      color: z.string().optional(),
      style: z.string().optional(),
    })
    .optional(),
  wardrobeContext: z.array(z.string()).optional(),
});

// Outfit Schemas
export const OutfitItemSlotSchema = z.object({
  slot: CategoryEnum,
  itemId: z.string().min(1),
  productId: z.string().optional(),
  name: z.string().min(1),
  imageUrl: z.string(),
  category: CategoryEnum,
  price: z.number().nonnegative(),
  source: z.enum(['wardrobe', 'recommendation']),
  locked: z.boolean().default(false),
});

export const OutfitGenerateSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  occasion: OccasionEnum,
  season: SeasonEnum.optional(),
  budget: z.number().positive().optional(),
  style: z.string().optional(),
  lockedItems: z.array(OutfitItemSlotSchema).optional(),
});

const OutfitObjectSchema = z.object({
  outfitId: z.string(),
  occasion: OccasionEnum,
  season: SeasonEnum,
  items: z.array(OutfitItemSlotSchema),
  coverage: z.number(),
  caption: z.string(),
  totalCost: z.number(),
  missingItems: z.array(CategoryEnum),
  compatibilityScore: z.number(),
});

export const OutfitReplaceSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  outfit: OutfitObjectSchema.optional(),
  currentOutfit: OutfitObjectSchema.optional(),
  slot: CategoryEnum.optional(),
  slotToReplace: CategoryEnum.optional(),
  preferences: z.record(z.any()).optional(),
}).refine((data) => data.outfit || data.currentOutfit, {
  message: 'Either outfit or currentOutfit must be provided',
}).refine((data) => data.slot || data.slotToReplace, {
  message: 'Either slot or slotToReplace must be provided',
});

export const OutfitShuffleSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  occasion: OccasionEnum.optional(),
  season: SeasonEnum.optional(),
  budget: z.number().positive().optional(),
  style: z.string().optional(),
  lockedItems: z.array(OutfitItemSlotSchema).default([]),
  currentOutfit: OutfitObjectSchema.optional(),
  outfit: OutfitObjectSchema.optional(),
});

export const SavedOutfitCreateSchema = z.object({
  outfitId: z.string().optional(),
  occasion: OccasionEnum,
  items: z.array(OutfitItemSlotSchema).min(1, 'At least one item required'),
  caption: z.string().default(''),
});

// Browsing Event Schema
export const BrowsingEventSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  eventType: BrowsingEventTypeEnum,
  timestamp: z.string().optional(),
});

// Feedback Schema
export const FeedbackSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  type: FeedbackTypeEnum,
});

// Offer Validation Schema
export const OfferValidationSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  productId: z.string().optional(),
  offerId: z.string().optional(),
  cartTotal: z.number().optional(),
});

// AI Stylist Schema
export const AiStylistRequestSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().optional(),
});
