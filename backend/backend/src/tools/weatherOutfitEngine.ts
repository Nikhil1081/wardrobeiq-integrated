import { getWeatherForLocation, WeatherInfo } from '../services/weather.service.js';
import { getWardrobesCollection, getCustomersCollection, getProductsCollection } from '../db/collections.js';
import { WardrobeDocument, ProductDocument, Occasion } from '../types/domain.js';
import { logger } from '../utils/logger.js';

export interface WeatherOutfitResult {
  weather: WeatherInfo;
  occasion: string;
  outfit: {
    top?: WardrobeDocument;
    bottom?: WardrobeDocument;
    outerwear?: WardrobeDocument;
    footwear?: WardrobeDocument;
    accessories?: WardrobeDocument;
    traditional?: WardrobeDocument;
  };
  stylingRationale: string;
  weatherAdvisory: string;
  missingLayerGap?: {
    category: string;
    description: string;
    recommendedProduct?: ProductDocument;
  };
  paletteHarmony: string[];
}

export async function generateWeatherOutfit(params: {
  customerId: string;
  city?: string;
  occasion?: Occasion | string;
  preset?: string;
}): Promise<WeatherOutfitResult> {
  const { customerId, city, preset } = params;
  const occasion = (params.occasion || 'casual') as Occasion;

  const customersCol = getCustomersCollection();
  const wardrobesCol = getWardrobesCollection();
  const productsCol = getProductsCollection();

  const customer = await customersCol.findOne({ customerId });
  const wardrobeItems = await wardrobesCol.find({ customerId }).toArray();

  const weather = await getWeatherForLocation({
    city: city || customer?.city || 'Mumbai',
    preset,
  });

  logger.info(
    `Generating weather-aware outfit for customer ${customerId} in ${weather.city} (${weather.temperature}°C, ${weather.condition}, band: ${weather.thermalBand})`
  );

  const preferredColors = customer?.preferredColors || ['black', 'navy', 'white'];
  const avoidedColors = customer?.avoidedColors || ['neon'];

  // Categorize customer's wardrobe items
  const tops = wardrobeItems.filter((w) => w.category === 'top');
  const bottoms = wardrobeItems.filter((w) => w.category === 'bottom');
  const outerwears = wardrobeItems.filter((w) => w.category === 'outerwear');
  const footwears = wardrobeItems.filter((w) => w.category === 'shoes');
  const accessories = wardrobeItems.filter((w) => w.category === 'accessory');
  const traditionals = wardrobeItems.filter(
    (w) => w.category === 'traditional' || w.isTraditional
  );

  // Score candidate item based on occasion, weather compatibility, and color preference
  function scoreItem(item: WardrobeDocument, role: 'top' | 'bottom' | 'outerwear' | 'footwear' | 'traditional'): number {
    let score = 10;

    // Occasion match
    if (item.occasion && item.occasion.includes(occasion)) score += 15;

    // Color preference
    if (preferredColors.some((c) => item.color?.toLowerCase().includes(c.toLowerCase()))) score += 10;
    if (avoidedColors.some((c) => item.color?.toLowerCase().includes(c.toLowerCase()))) score -= 20;

    // Thermal band suitability
    const sub = (item.subcategory || '').toLowerCase();
    const name = (item.name || '').toLowerCase();

    if (weather.thermalBand === 'freezing' || weather.thermalBand === 'cool') {
      if (role === 'top' && (sub.includes('knit') || sub.includes('sweater') || name.includes('sweater') || name.includes('wool'))) score += 15;
      if (role === 'bottom' && (sub.includes('pants') || sub.includes('jeans') || sub.includes('trousers'))) score += 10;
      if (role === 'bottom' && (sub.includes('shorts') || sub.includes('skirt'))) score -= 15;
      if (role === 'footwear' && (sub.includes('boot') || name.includes('boot') || name.includes('leather'))) score += 15;
    } else if (weather.thermalBand === 'hot' || weather.thermalBand === 'warm') {
      if (role === 'top' && (sub.includes('linen') || sub.includes('tee') || sub.includes('shirt') || name.includes('linen') || name.includes('cotton'))) score += 15;
      if (role === 'top' && (sub.includes('sweater') || name.includes('wool'))) score -= 25;
      if (role === 'bottom' && (sub.includes('linen') || sub.includes('shorts') || sub.includes('chino'))) score += 10;
      if (role === 'footwear' && (sub.includes('sneaker') || sub.includes('loafer') || sub.includes('sandal'))) score += 10;
      if (role === 'footwear' && sub.includes('boot')) score -= 20;
    }

    // Rain suitability
    if (weather.isRainy) {
      if (role === 'outerwear' && (name.includes('weather') || name.includes('parka') || name.includes('trench') || name.includes('rain'))) score += 20;
      if (role === 'footwear' && (sub.includes('boot') || name.includes('leather'))) score += 15;
      if (role === 'footwear' && sub.includes('sandal')) score -= 25;
    }

    return score;
  }

  function pickBest(items: WardrobeDocument[], role: 'top' | 'bottom' | 'outerwear' | 'footwear' | 'traditional'): WardrobeDocument | undefined {
    if (items.length === 0) return undefined;
    const sorted = [...items].sort((a, b) => scoreItem(b, role) - scoreItem(a, role));
    return sorted[0];
  }

  const outfit: WeatherOutfitResult['outfit'] = {};
  const isTraditionalOccasion = occasion === 'festival' || occasion === 'wedding';

  if (isTraditionalOccasion && traditionals.length > 0) {
    outfit.traditional = pickBest(traditionals, 'traditional');
    // If it's a top-style traditional (e.g. Kurta), add matching bottom
    if (outfit.traditional?.subcategory?.includes('kurta') && bottoms.length > 0) {
      outfit.bottom = pickBest(bottoms, 'bottom');
    }
  } else {
    outfit.top = pickBest(tops, 'top');
    outfit.bottom = pickBest(bottoms, 'bottom');
  }

  outfit.footwear = pickBest(footwears, 'footwear');

  // Outerwear needed if freezing, cool, or rainy
  const needsOuterwear = weather.thermalBand === 'freezing' || weather.thermalBand === 'cool' || weather.isRainy;
  let missingLayerGap: WeatherOutfitResult['missingLayerGap'] = undefined;

  if (needsOuterwear) {
    const bestOuter = pickBest(outerwears, 'outerwear');
    if (bestOuter) {
      outfit.outerwear = bestOuter;
    } else {
      // Customer has a wardrobe gap for this weather!
      const gapDesc = weather.isRainy
        ? 'Water-Resistant Rain Parka or Trench Coat'
        : weather.thermalBand === 'freezing'
        ? 'Heavy Insulated Overcoat or Wool Parka'
        : 'Lightweight Layering Jacket or Cardigan';

      const queryCategory = 'outerwear';
      const recommended = await productsCol
        .find({ category: queryCategory })
        .limit(1)
        .toArray();

      missingLayerGap = {
        category: queryCategory,
        description: gapDesc,
        recommendedProduct: recommended[0] || undefined,
      };
    }
  }

  if (accessories.length > 0) {
    outfit.accessories = pickBest(accessories, 'top');
  }

  // Generate Weather Advisory
  let weatherAdvisory = '';
  if (weather.thermalBand === 'freezing') {
    weatherAdvisory = `Sub-zero chill (${weather.temperature}°C). High insulation and thermal layering are critical to stay warm and comfortable.`;
  } else if (weather.thermalBand === 'cool') {
    weatherAdvisory = `Brisk temperature (${weather.temperature}°C). A structured outer layer or sweater ensures optimal comfort throughout the day.`;
  } else if (weather.thermalBand === 'hot') {
    weatherAdvisory = `High heat warning (${weather.temperature}°C). Prioritize breathable natural fibers (linen/cotton) to prevent overheating.`;
  } else {
    weatherAdvisory = `Pleasant mild climate (${weather.temperature}°C). Excellent versatility for clean silhouettes and easy day-to-night transitions.`;
  }

  if (weather.isRainy) {
    weatherAdvisory += ` Notice: Rain/precipitation detected (${weather.precipitation}mm). Water protection recommended.`;
  }

  // Generate Styling Rationale
  const piecesUsed: string[] = [];
  if (outfit.traditional) piecesUsed.push(outfit.traditional.name);
  if (outfit.top) piecesUsed.push(outfit.top.name);
  if (outfit.bottom) piecesUsed.push(outfit.bottom.name);
  if (outfit.outerwear) piecesUsed.push(outfit.outerwear.name);
  if (outfit.footwear) piecesUsed.push(outfit.footwear.name);

  const stylingRationale = `Selected from your wardrobe for ${weather.city}'s ${weather.temperature}°C ${weather.condition.toLowerCase()} weather: A balanced ensemble pairing ${piecesUsed.join(' with ')}. This combination is curated for a ${occasion} setting while respecting your ${customer?.preferredStyles?.[0] || 'smart-casual'} aesthetic and keeping you comfortable under today's atmospheric conditions.`;

  const paletteHarmony: string[] = [
    outfit.traditional?.color,
    outfit.top?.color,
    outfit.bottom?.color,
    outfit.outerwear?.color,
    outfit.footwear?.color,
  ]
    .filter(Boolean)
    .map((c) => String(c));

  return {
    weather,
    occasion,
    outfit,
    stylingRationale,
    weatherAdvisory,
    missingLayerGap,
    paletteHarmony,
  };
}
