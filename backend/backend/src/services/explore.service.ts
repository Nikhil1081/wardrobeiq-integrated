import { getProductsCollection, getWardrobesCollection } from '../db/collections.js';
import { toProductCardDTO } from '../tools/catalogueTools.js';
import { toWardrobeItemDTO } from '../tools/wardrobeTools.js';
import { recordBrowsingEvent } from '../tools/browsingTools.js';
import { ProductCardDTO, WardrobeItemDTO } from '../types/dto.js';
import { Category, Occasion, Season, WardrobeDocument, BrowsingEventType } from '../types/domain.js';
import { ApiError } from '../utils/response.js';

export async function getExploreCollectionsService(): Promise<Record<string, ProductCardDTO[]>> {
  const collection = getProductsCollection();

  const [
    trending,
    seasonal,
    college,
    minimal,
    weekend,
    dateNight,
    workwear,
    monsoon,
    traditional,
  ] = await Promise.all([
    collection.find({ available: true, styleTags: 'streetwear' }).limit(8).toArray(),
    collection.find({ available: true, season: 'summer' }).limit(8).toArray(),
    collection.find({ available: true, occasion: 'college' }).limit(8).toArray(),
    collection.find({ available: true, styleTags: 'minimalist' }).limit(8).toArray(),
    collection.find({ available: true, occasion: 'weekend' }).limit(8).toArray(),
    collection.find({ available: true, occasion: 'dateNight' }).limit(8).toArray(),
    collection.find({ available: true, occasion: 'workwear' }).limit(8).toArray(),
    collection.find({ available: true, season: 'monsoon' }).limit(8).toArray(),
    collection.find({ available: true, category: 'traditional' }).limit(8).toArray(),
  ]);

  return {
    trending: trending.map(toProductCardDTO),
    seasonal: seasonal.map(toProductCardDTO),
    college: college.map(toProductCardDTO),
    minimal: minimal.map(toProductCardDTO),
    weekend: weekend.map(toProductCardDTO),
    dateNight: dateNight.map(toProductCardDTO),
    workwear: workwear.map(toProductCardDTO),
    monsoon: monsoon.map(toProductCardDTO),
    traditional: traditional.map(toProductCardDTO),
  };
}

export async function getExploreProductsService(query: {
  search?: string;
  category?: Category;
  subcategory?: string;
  color?: string;
  style?: string;
  occasion?: Occasion;
  season?: Season;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sort?: string;
}): Promise<{
  items: ProductCardDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const collection = getProductsCollection();
  const filter: any = { available: true };

  if (query.category) {
    filter.category = query.category;
  }
  if (query.subcategory) {
    filter.subcategory = query.subcategory;
  }
  if (query.color) {
    filter.color = { $regex: new RegExp(`^${query.color}$`, 'i') };
  }
  if (query.style) {
    filter.styleTags = { $regex: new RegExp(query.style, 'i') };
  }
  if (query.occasion) {
    filter.occasion = query.occasion;
  }
  if (query.season) {
    filter.season = { $in: [query.season, 'all-season'] };
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice !== undefined) filter.price.$lte = Number(query.maxPrice);
  }
  if (query.search) {
    const term = query.search.trim();
    filter.$or = [
      { name: { $regex: new RegExp(term, 'i') } },
      { subcategory: { $regex: new RegExp(term, 'i') } },
      { color: { $regex: new RegExp(term, 'i') } },
      { store: { $regex: new RegExp(term, 'i') } },
      { styleTags: { $regex: new RegExp(term, 'i') } },
    ];
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 24));
  const skip = (page - 1) * limit;

  let sortObj: any = { createdAt: -1 };
  if (query.sort === 'price_asc') sortObj = { price: 1 };
  else if (query.sort === 'price_desc') sortObj = { price: -1 };
  else if (query.sort === 'name_asc') sortObj = { name: 1 };

  const [total, products] = await Promise.all([
    collection.countDocuments(filter),
    collection.find(filter).sort(sortObj).skip(skip).limit(limit).toArray(),
  ]);

  return {
    items: products.map(toProductCardDTO),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function addProductToWardrobeService(
  customerId: string,
  productId: string
): Promise<WardrobeItemDTO> {
  const productsCol = getProductsCollection();
  const wardrobesCol = getWardrobesCollection();

  const product = await productsCol.findOne({ productId });
  if (!product) {
    throw ApiError.notFound(`Catalogue product ${productId} not found.`);
  }

  const itemId = `W_${customerId}_${product.category}_${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const newWardrobeItem: WardrobeDocument = {
    itemId,
    customerId,
    productId: product.productId,
    name: product.name,
    category: product.category,
    subcategory: product.subcategory,
    color: product.color,
    secondaryColor: product.secondaryColor,
    brand: product.store,
    style: product.style || 'casual',
    styleTags: product.styleTags || ['casual'],
    material: product.material,
    pattern: product.pattern,
    occasion: product.occasion,
    season: product.season,
    weatherSuitability: product.weatherSuitability,
    price: product.price,
    store: product.store,
    imageUrl: product.imageUrl,
    thumbnailUrl: product.thumbnailUrl,
    imageHash: product.imageHash,
    imageStatus: 'verified',
    dateAcquired: now.split('T')[0],
    isCustom: false,
    favorite: false,
    createdAt: now,
    updatedAt: now,
  };

  await wardrobesCol.insertOne(newWardrobeItem);

  // Record live telemetry interaction
  await recordBrowsingEvent(customerId, productId, 'ADD_TO_WARDROBE').catch(() => {});

  return toWardrobeItemDTO(newWardrobeItem);
}

export async function recordExploreInteractionService(
  customerId: string,
  data: {
    eventType: BrowsingEventType;
    productId?: string;
    searchQuery?: string;
    category?: Category;
  }
): Promise<{ success: boolean }> {
  await recordBrowsingEvent(customerId, data.productId, data.eventType);
  return { success: true };
}
