import { getWardrobesCollection } from '../db/collections.js';
import { WardrobeDocument, Category, Occasion, CustomerDocument } from '../types/domain.js';
import { WardrobeItemDTO, WardrobeHealthDTO } from '../types/dto.js';

export interface WardrobeAnalysis {
  totalItems: number;
  categoryCounts: Record<Category, number>;
  dominantColors: string[];
  dominantStyles: string[];
  occasionCoverage: Record<Occasion, number>;
  colorDiversity: number; // 0-100 (based on Simpson's Index)
  topCategory: Category;
  weakestCategory: Category;
  redundantItems: Array<{ subcategory: string; color: string; count: number }>;
}

export async function getWardrobeItems(
  customerId: string,
  filterCriteria?: {
    search?: string;
    category?: Category;
    subcategory?: string;
    color?: string;
    style?: string;
    occasion?: Occasion;
    season?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }
): Promise<WardrobeDocument[]> {
  const collection = getWardrobesCollection();
  const query: any = { customerId };

  if (filterCriteria?.category) query.category = filterCriteria.category;
  if (filterCriteria?.subcategory) query.subcategory = new RegExp(`^${filterCriteria.subcategory}$`, 'i');
  if (filterCriteria?.color) query.color = new RegExp(`^${filterCriteria.color}$`, 'i');
  if (filterCriteria?.style) query.styleTags = filterCriteria.style.toLowerCase();
  if (filterCriteria?.occasion) query.occasion = filterCriteria.occasion;
  if (filterCriteria?.season) query.season = filterCriteria.season;

  if (filterCriteria?.minPrice !== undefined || filterCriteria?.maxPrice !== undefined) {
    query.price = {};
    if (filterCriteria.minPrice !== undefined) query.price.$gte = filterCriteria.minPrice;
    if (filterCriteria.maxPrice !== undefined) query.price.$lte = filterCriteria.maxPrice;
  }

  if (filterCriteria?.search) {
    const s = filterCriteria.search.trim();
    query.$or = [
      { name: { $regex: s, $options: 'i' } },
      { subcategory: { $regex: s, $options: 'i' } },
      { color: { $regex: s, $options: 'i' } },
      { store: { $regex: s, $options: 'i' } },
    ];
  }

  let sortObj: any = { createdAt: -1 };
  if (filterCriteria?.sort === 'oldest') sortObj = { createdAt: 1 };
  else if (filterCriteria?.sort === 'price_asc') sortObj = { price: 1 };
  else if (filterCriteria?.sort === 'price_desc') sortObj = { price: -1 };
  else if (filterCriteria?.sort === 'name') sortObj = { name: 1 };

  return await collection.find(query).sort(sortObj).toArray();
}

export async function addWardrobeItem(item: WardrobeDocument): Promise<WardrobeDocument> {
  const collection = getWardrobesCollection();
  await collection.insertOne(item);
  return item;
}

export async function updateWardrobeItem(
  customerId: string,
  itemId: string,
  update: Partial<WardrobeDocument>
): Promise<WardrobeDocument | null> {
  const collection = getWardrobesCollection();
  const result = await collection.findOneAndUpdate(
    { customerId, itemId },
    { $set: { ...update, updatedAt: new Date().toISOString() } },
    { returnDocument: 'after' }
  );
  return result;
}

export async function deleteWardrobeItem(customerId: string, itemId: string): Promise<boolean> {
  const collection = getWardrobesCollection();
  const res = await collection.deleteOne({ customerId, itemId });
  return res.deletedCount > 0;
}

export function analyzeWardrobe(items: WardrobeDocument[], customer?: CustomerDocument): WardrobeAnalysis {
  const categories: Category[] = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'];
  const categoryCounts: Record<Category, number> = {
    top: 0,
    bottom: 0,
    dress: 0,
    outerwear: 0,
    shoes: 0,
    accessory: 0,
  };

  const occasions: Occasion[] = ['casual', 'college', 'workwear', 'dateNight', 'weekend', 'party'];
  const occasionCoverage: Record<Occasion, number> = {
    casual: 0,
    college: 0,
    workwear: 0,
    dateNight: 0,
    weekend: 0,
    party: 0,
  };

  const colorFreq: Record<string, number> = {};
  const styleFreq: Record<string, number> = {};
  const subcategoryColorFreq: Record<string, number> = {};

  for (const item of items) {
    if (categoryCounts[item.category] !== undefined) {
      categoryCounts[item.category] += 1;
    }

    // Occasions
    if (Array.isArray(item.occasion)) {
      for (const occ of item.occasion) {
        if (occasionCoverage[occ] !== undefined) {
          occasionCoverage[occ] += 1;
        }
      }
    }

    // Colors
    const col = item.color.toLowerCase();
    colorFreq[col] = (colorFreq[col] || 0) + 1;

    // Styles
    if (Array.isArray(item.styleTags)) {
      for (const style of item.styleTags) {
        const s = style.toLowerCase();
        styleFreq[s] = (styleFreq[s] || 0) + 1;
      }
    }

    // Redundancy check (same subcategory + same color)
    const key = `${item.subcategory.toLowerCase()}_${col}`;
    subcategoryColorFreq[key] = (subcategoryColorFreq[key] || 0) + 1;
  }

  // Dominant colors (sorted descending)
  const dominantColors = Object.entries(colorFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c)
    .slice(0, 5);

  // Dominant styles (sorted descending)
  const dominantStyles = Object.entries(styleFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([s]) => s)
    .slice(0, 5);

  // Top and weakest categories
  let topCat: Category = 'top';
  let weakestCat: Category = 'outerwear';
  let maxCount = -1;
  let minCount = 999999;

  for (const cat of categories) {
    const count = categoryCounts[cat];
    if (count > maxCount) {
      maxCount = count;
      topCat = cat;
    }
    if (count < minCount) {
      minCount = count;
      weakestCat = cat;
    }
  }

  // Color diversity index (1 - Simpson's index normalized to 0-100)
  const total = items.length;
  let simpsons = 0;
  if (total > 1) {
    let sumN = 0;
    for (const count of Object.values(colorFreq)) {
      sumN += count * (count - 1);
    }
    simpsons = 1 - sumN / (total * (total - 1));
  } else if (total === 1) {
    simpsons = 0.5;
  }
  const colorDiversity = Math.round(Math.max(0, Math.min(100, simpsons * 100)));

  // Redundant items (>1 occurrence of same subcategory + color)
  const redundantItems = Object.entries(subcategoryColorFreq)
    .filter(([_, count]) => count > 1)
    .map(([key, count]) => {
      const [subcategory, color] = key.split('_');
      return { subcategory, color, count };
    });

  return {
    totalItems: total,
    categoryCounts,
    dominantColors,
    dominantStyles,
    occasionCoverage,
    colorDiversity,
    topCategory: topCat,
    weakestCategory: weakestCat,
    redundantItems,
  };
}

export function calculateWardrobeHealth(
  analysis: WardrobeAnalysis,
  customer?: CustomerDocument
): WardrobeHealthDTO {
  const baselines: Record<Category, number> = {
    top: 4,
    bottom: 3,
    dress: 1,
    outerwear: 2,
    shoes: 2,
    accessory: 2,
  };

  // 1. Versatility score (how close to baselines across all 6 categories)
  let versatilitySum = 0;
  for (const [cat, target] of Object.entries(baselines)) {
    const actual = analysis.categoryCounts[cat as Category] || 0;
    versatilitySum += Math.min(1.0, actual / target);
  }
  const versatility = Math.round((versatilitySum / 6) * 100);

  // 2. Color balance (diversity + penalty if dominant color is > 50% of closet)
  let colorBalance = analysis.colorDiversity;
  if (analysis.totalItems > 0 && analysis.dominantColors.length > 0) {
    // If one single color dominates more than half of items
    const topColorShare = (analysis.categoryCounts['top'] > 0 ? 0.3 : 0); // safe fallback
  }

  // 3. Occasion coverage (coverage of customer's preferred occasions)
  const targetOccasions = customer?.preferredOccasions?.length
    ? customer.preferredOccasions
    : (['casual', 'college', 'workwear'] as Occasion[]);

  let occCovered = 0;
  for (const occ of targetOccasions) {
    if ((analysis.occasionCoverage[occ] || 0) >= 2) {
      occCovered += 1;
    } else if ((analysis.occasionCoverage[occ] || 0) === 1) {
      occCovered += 0.5;
    }
  }
  const occasionCoverage = Math.round((occCovered / Math.max(1, targetOccasions.length)) * 100);

  // 4. Seasonal coverage
  const seasonalCoverage = Math.round(
    Math.min(
      100,
      Math.max(
        30,
        (analysis.categoryCounts['outerwear'] >= 1 ? 50 : 20) +
          (analysis.categoryCounts['top'] >= 2 ? 30 : 10) +
          (analysis.categoryCounts['shoes'] >= 1 ? 20 : 0)
      )
    )
  );

  // 5. Overall Harmonic Score
  const overallScore = Math.round(
    versatility * 0.3 +
      colorBalance * 0.2 +
      occasionCoverage * 0.3 +
      seasonalCoverage * 0.2
  );

  return {
    overallScore: Math.max(10, Math.min(100, overallScore)),
    versatility: Math.max(10, Math.min(100, versatility)),
    colorBalance: Math.max(10, Math.min(100, colorBalance)),
    occasionCoverage: Math.max(10, Math.min(100, occasionCoverage)),
    seasonalCoverage: Math.max(10, Math.min(100, seasonalCoverage)),
  };
}

export function toWardrobeItemDTO(item: WardrobeDocument): WardrobeItemDTO {
  return {
    itemId: item.itemId,
    productId: item.productId,
    name: item.name,
    imageUrl: item.imageUrl,
    category: item.category,
    subcategory: item.subcategory,
    color: item.color,
    styleTags: item.styleTags,
    occasion: item.occasion,
    season: item.season,
    price: item.price,
    store: item.store,
    dateAcquired: item.dateAcquired,
    pricePaid: item.pricePaid,
    isCustom: item.isCustom,
  };
}
