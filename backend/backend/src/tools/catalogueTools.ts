import { getProductsCollection } from '../db/collections.js';
import { ProductDocument, Category, Occasion, Season, CustomerDocument } from '../types/domain.js';
import { ProductCardDTO } from '../types/dto.js';

export async function getProductById(productId: string): Promise<ProductDocument | null> {
  const collection = getProductsCollection();
  return await collection.findOne({ productId });
}

export async function searchCatalogueProducts(criteria: {
  search?: string;
  category?: Category;
  subcategory?: string;
  color?: string;
  style?: string;
  occasion?: Occasion;
  season?: Season;
  minPrice?: number;
  maxPrice?: number;
  store?: string;
  limit?: number;
  page?: number;
}): Promise<{ products: ProductDocument[]; total: number }> {
  const collection = getProductsCollection();
  const query: any = { available: true };

  if (criteria.category) query.category = criteria.category;
  if (criteria.subcategory) query.subcategory = new RegExp(`^${criteria.subcategory}$`, 'i');
  if (criteria.color) query.color = new RegExp(`^${criteria.color}$`, 'i');
  if (criteria.style) query.styleTags = criteria.style.toLowerCase();
  if (criteria.occasion) query.occasion = criteria.occasion;
  if (criteria.season) query.season = criteria.season;
  if (criteria.store) query.store = new RegExp(`^${criteria.store}$`, 'i');

  if (criteria.minPrice !== undefined || criteria.maxPrice !== undefined) {
    query.price = {};
    if (criteria.minPrice !== undefined) query.price.$gte = criteria.minPrice;
    if (criteria.maxPrice !== undefined) query.price.$lte = criteria.maxPrice;
  }

  if (criteria.search) {
    const s = criteria.search.trim();
    query.$or = [
      { name: { $regex: s, $options: 'i' } },
      { subcategory: { $regex: s, $options: 'i' } },
      { color: { $regex: s, $options: 'i' } },
      { store: { $regex: s, $options: 'i' } },
      { styleTags: { $regex: s, $options: 'i' } },
    ];
  }

  const limit = criteria.limit || 20;
  const page = criteria.page || 1;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    collection.find(query).skip(skip).limit(limit).toArray(),
    collection.countDocuments(query),
  ]);

  return { products, total };
}

export async function getRecommendationCandidates(
  customer: CustomerDocument,
  ownedProductIds: Set<string>,
  targetCategory?: Category,
  budgetCeiling?: number
): Promise<ProductDocument[]> {
  const collection = getProductsCollection();
  const maxBudget = budgetCeiling
    ? Math.max(budgetCeiling * 1.25, 2500)
    : (customer.budget ? customer.budget * 1.5 : 5000);

  const query: any = {
    available: true,
    price: { $lte: maxBudget },
  };

  if (targetCategory) {
    query.category = targetCategory;
  }

  // Fetch candidate pool (up to 150 items for scoring)
  const candidates = await collection.find(query).limit(150).toArray();

  // In-memory strict filter:
  // 1. NEVER recommend owned products
  // 2. Filter out customer avoided colors unless budget override
  return candidates.filter((item) => {
    if (ownedProductIds.has(item.productId)) return false;

    if (customer.avoidedColors && customer.avoidedColors.length > 0) {
      const isAvoided = customer.avoidedColors.some(
        (ac) => ac.toLowerCase() === item.color.toLowerCase()
      );
      if (isAvoided) return false;
    }

    return true;
  });
}

export function toProductCardDTO(product: ProductDocument): ProductCardDTO {
  const discountPercentage =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const badges: string[] = [];
  if (discountPercentage > 0) badges.push(`${discountPercentage}% OFF`);
  if (product.styleTags?.includes('trending')) badges.push('Trending');

  return {
    productId: product.productId,
    name: product.name,
    imageUrl: product.imageUrl,
    category: product.category,
    subcategory: product.subcategory,
    color: product.color,
    styleTags: product.styleTags,
    occasion: product.occasion,
    season: product.season,
    price: product.price,
    originalPrice: product.originalPrice,
    discountPercentage,
    store: product.store,
    badges,
    available: product.available,
    createdAt: product.createdAt,
  };
}
