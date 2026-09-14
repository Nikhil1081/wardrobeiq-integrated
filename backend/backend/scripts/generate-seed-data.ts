import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ---------------------------------------------------------------------------
// 1. LOAD CURATED FASHION ASSETS (VERIFIED UNIQUE UNSPLASH IMAGES)
// ---------------------------------------------------------------------------
const curatedAssetsPath = path.join(dataDir, 'curated_fashion_assets.json');
if (!fs.existsSync(curatedAssetsPath)) {
  throw new Error(`Curated fashion assets not found at ${curatedAssetsPath}. Please run fetch-fashion-assets.mjs first.`);
}

const CURATED_ASSETS: Record<string, string[]> = JSON.parse(fs.readFileSync(curatedAssetsPath, 'utf8'));

// ---------------------------------------------------------------------------
// 2. FASHION TAXONOMY & METADATA TEMPLATES
// ---------------------------------------------------------------------------
const CATEGORIES = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'traditional'] as const;
type Category = typeof CATEGORIES[number];

const STORES = [
  'Zara', 'H&M', 'Uniqlo', 'FabIndia', 'Mango', "Levi's", 'Nike',
  'Marks & Spencer', 'Westside', 'Snitch', 'Biba', 'Allen Solly', 'Manyavar',
  'FabAlley', 'Massimo Dutti', 'Cos', 'Anthropologie', 'Ted Baker', 'ASOS',
  'Reiss', 'Scotch & Soda', 'Tommy Hilfiger', 'Superdry', 'Fabindia Experience'
];

const OCCASIONS = [
  'casual', 'college', 'workwear', 'dateNight', 'weekend',
  'party', 'wedding', 'festival', 'formal', 'travel'
] as const;

const SEASONS = ['summer', 'monsoon', 'winter', 'spring', 'autumn', 'tropical', 'all-season'] as const;

const SUBCATEGORIES: Record<Category, Array<{ subcat: string; prefix: string; colors: string[]; styles: string[]; occasions: string[]; seasons: string[]; minP: number; maxP: number }>> = {
  top: [
    { subcat: 'shirt', prefix: 'Classic Cotton Oxford Shirt', colors: ['white', 'light-blue', 'navy', 'pink'], styles: ['formal', 'workwear', 'smart-casual'], occasions: ['workwear', 'formal', 'weekend'], seasons: ['all-season', 'summer'], minP: 1899, maxP: 3499 },
    { subcat: 'linen-shirt', prefix: 'Breezy Pure Linen Shirt', colors: ['beige', 'olive', 'white', 'sage'], styles: ['casual', 'smart-casual', 'minimalist'], occasions: ['weekend', 'travel', 'casual'], seasons: ['summer', 'tropical'], minP: 2299, maxP: 4299 },
    { subcat: 't-shirt', prefix: 'Supima Cotton Crew T-Shirt', colors: ['black', 'charcoal', 'white', 'maroon'], styles: ['casual', 'streetwear', 'minimalist'], occasions: ['casual', 'college', 'weekend'], seasons: ['all-season'], minP: 899, maxP: 1899 },
    { subcat: 'polo', prefix: 'Textured Pique Knit Polo', colors: ['navy', 'forest-green', 'burgundy', 'cream'], styles: ['smart-casual', 'preppy'], occasions: ['weekend', 'casual', 'college'], seasons: ['all-season'], minP: 1499, maxP: 2999 },
    { subcat: 'blouse', prefix: 'Silk-Blend Drape Blouse', colors: ['ivory', 'emerald', 'champagne', 'black'], styles: ['chic', 'smart-casual', 'formal'], occasions: ['workwear', 'dateNight', 'party'], seasons: ['all-season'], minP: 2499, maxP: 4999 },
    { subcat: 'crop-top', prefix: 'Ribbed Knit Scoop Crop Top', colors: ['terracotta', 'black', 'white', 'lilac'], styles: ['streetwear', 'casual'], occasions: ['party', 'weekend', 'college'], seasons: ['summer', 'all-season'], minP: 999, maxP: 1999 },
    { subcat: 'oversized-tee', prefix: 'Heavyweight Boxy Graphic Tee', colors: ['off-white', 'black', 'washed-grey'], styles: ['streetwear', 'casual'], occasions: ['college', 'casual', 'weekend'], seasons: ['all-season'], minP: 1299, maxP: 2499 }
  ],
  bottom: [
    { subcat: 'jeans', prefix: 'Straight-Leg Rigid Indigo Denim', colors: ['indigo', 'vintage-blue', 'black', 'stone-wash'], styles: ['casual', 'streetwear'], occasions: ['casual', 'college', 'weekend'], seasons: ['all-season'], minP: 2499, maxP: 4999 },
    { subcat: 'chinos', prefix: 'Tailored Slim Stretch Chinos', colors: ['khaki', 'navy', 'olive', 'stone'], styles: ['smart-casual', 'workwear', 'preppy'], occasions: ['workwear', 'casual', 'weekend'], seasons: ['all-season'], minP: 2199, maxP: 3799 },
    { subcat: 'trousers', prefix: 'Pleated High-Waist Wool Trousers', colors: ['charcoal', 'taupe', 'black', 'grey'], styles: ['formal', 'workwear', 'minimalist'], occasions: ['workwear', 'formal', 'dateNight'], seasons: ['all-season', 'winter'], minP: 2999, maxP: 5999 },
    { subcat: 'cargo-pants', prefix: 'Utility Multi-Pocket Cargo Trousers', colors: ['olive-drab', 'black', 'khaki'], styles: ['streetwear', 'casual'], occasions: ['casual', 'weekend', 'travel'], seasons: ['all-season'], minP: 2499, maxP: 4299 },
    { subcat: 'skirt', prefix: 'Pleated Flowy Midi Skirt', colors: ['navy', 'rust', 'champagne', 'emerald'], styles: ['chic', 'smart-casual', 'vintage'], occasions: ['dateNight', 'workwear', 'party'], seasons: ['all-season', 'spring'], minP: 1999, maxP: 3999 },
    { subcat: 'linen-trousers', prefix: 'Relaxed Wide-Leg Linen Trousers', colors: ['ecru', 'sand', 'navy', 'terracotta'], styles: ['minimalist', 'casual', 'resort'], occasions: ['travel', 'weekend', 'casual'], seasons: ['summer', 'tropical'], minP: 2499, maxP: 4499 }
  ],
  dress: [
    { subcat: 'midi-dress', prefix: 'Wrap-Front Floral Print Midi Dress', colors: ['floral-navy', 'sage', 'rust', 'mustard'], styles: ['chic', 'casual', 'vintage'], occasions: ['weekend', 'dateNight', 'party'], seasons: ['spring', 'summer', 'all-season'], minP: 2999, maxP: 5999 },
    { subcat: 'cocktail-dress', prefix: 'Satin Bias-Cut Slip Dress', colors: ['emerald', 'burgundy', 'champagne', 'midnight-black'], styles: ['chic', 'formal', 'glamour'], occasions: ['party', 'dateNight', 'wedding'], seasons: ['all-season'], minP: 3999, maxP: 8999 },
    { subcat: 'shirt-dress', prefix: 'Belted Crisp Poplin Shirt Dress', colors: ['crisp-white', 'sky-blue', 'olive', 'stripe'], styles: ['smart-casual', 'workwear', 'minimalist'], occasions: ['workwear', 'weekend', 'casual'], seasons: ['summer', 'all-season'], minP: 2799, maxP: 4999 },
    { subcat: 'maxi-dress', prefix: 'Tiered Bohemian Cotton Maxi Dress', colors: ['coral', 'white', 'teal', 'sunshine-yellow'], styles: ['bohemian', 'casual', 'resort'], occasions: ['travel', 'weekend', 'festival'], seasons: ['summer', 'tropical'], minP: 3299, maxP: 6499 },
    { subcat: 'evening-gown', prefix: 'Elegance Floor-Length Velvet Gown', colors: ['ruby-red', 'sapphire', 'onyx-black'], styles: ['formal', 'luxury'], occasions: ['wedding', 'formal', 'party'], seasons: ['winter', 'all-season'], minP: 6999, maxP: 14999 }
  ],
  outerwear: [
    { subcat: 'blazer', prefix: 'Structured Single-Breasted Tailored Blazer', colors: ['charcoal', 'navy', 'houndstooth', 'camel'], styles: ['formal', 'workwear', 'smart-casual'], occasions: ['workwear', 'formal', 'dateNight'], seasons: ['all-season', 'winter'], minP: 4999, maxP: 9999 },
    { subcat: 'leather-jacket', prefix: 'Vintage Grain Biker Leather Jacket', colors: ['black', 'dark-brown', 'cognac'], styles: ['streetwear', 'rocker', 'casual'], occasions: ['casual', 'party', 'weekend'], seasons: ['winter', 'autumn'], minP: 6999, maxP: 14999 },
    { subcat: 'trench-coat', prefix: 'Water-Repellent Double-Breasted Trench', colors: ['honey-tan', 'sand', 'black', 'navy'], styles: ['classic', 'chic', 'workwear'], occasions: ['workwear', 'travel', 'formal'], seasons: ['monsoon', 'winter', 'autumn'], minP: 5999, maxP: 12999 },
    { subcat: 'denim-jacket', prefix: 'Classic Trucker Rigid Denim Jacket', colors: ['vintage-indigo', 'washed-black', 'light-wash'], styles: ['casual', 'streetwear', 'vintage'], occasions: ['casual', 'weekend', 'college'], seasons: ['all-season', 'spring'], minP: 2999, maxP: 5499 },
    { subcat: 'hoodie', prefix: 'Heavyweight French Terry Zip Hoodie', colors: ['heather-grey', 'forest-green', 'black'], styles: ['athleisure', 'streetwear', 'casual'], occasions: ['casual', 'college', 'travel'], seasons: ['winter', 'all-season'], minP: 2499, maxP: 4499 },
    { subcat: 'cardigan', prefix: 'Chunky Ribbed Wool-Blend Cardigan', colors: ['cream', 'cinnamon', 'charcoal'], styles: ['minimalist', 'preppy', 'casual'], occasions: ['casual', 'workwear', 'weekend'], seasons: ['winter', 'autumn'], minP: 2799, maxP: 5299 }
  ],
  shoes: [
    { subcat: 'sneakers', prefix: 'Low-Top Minimalist Leather Sneakers', colors: ['white', 'off-white-gum', 'triple-black'], styles: ['casual', 'smart-casual', 'minimalist'], occasions: ['casual', 'college', 'weekend', 'travel'], seasons: ['all-season'], minP: 3499, maxP: 8999 },
    { subcat: 'boots', prefix: 'Chelsea Leather Pull-On Ankle Boots', colors: ['rich-cognac', 'black', 'espresso-suede'], styles: ['smart-casual', 'workwear', 'streetwear'], occasions: ['casual', 'workwear', 'dateNight'], seasons: ['winter', 'monsoon', 'autumn'], minP: 4499, maxP: 9999 },
    { subcat: 'loafers', prefix: 'Penny Loafers with Burnished Finish', colors: ['burgundy', 'tan', 'black'], styles: ['smart-casual', 'formal', 'preppy'], occasions: ['workwear', 'formal', 'weekend'], seasons: ['all-season'], minP: 3999, maxP: 7999 },
    { subcat: 'heels', prefix: 'Pointed Toe Block-Heel Leather Pumps', colors: ['nude', 'black', 'scarlet-red', 'metallic'], styles: ['chic', 'formal'], occasions: ['party', 'formal', 'wedding', 'dateNight'], seasons: ['all-season'], minP: 3299, maxP: 6999 },
    { subcat: 'sandals', prefix: 'Strappy Handcrafted Leather Sandals', colors: ['tan', 'gold', 'black'], styles: ['casual', 'bohemian', 'resort'], occasions: ['casual', 'travel', 'weekend'], seasons: ['summer', 'tropical'], minP: 1999, maxP: 3999 },
    { subcat: 'oxfords', prefix: 'Full-Grain Leather Brogue Oxford Shoes', colors: ['oxblood', 'dark-tan', 'black'], styles: ['formal', 'classic'], occasions: ['formal', 'workwear', 'wedding'], seasons: ['all-season'], minP: 4999, maxP: 10999 }
  ],
  accessory: [
    { subcat: 'handbag', prefix: 'Structured Saffiano Leather Tote Bag', colors: ['black', 'taupe', 'bordeaux', 'tan'], styles: ['workwear', 'chic', 'classic'], occasions: ['workwear', 'casual', 'travel'], seasons: ['all-season'], minP: 3999, maxP: 8999 },
    { subcat: 'sunglasses', prefix: 'Acetate Polarized Geometric Sunglasses', colors: ['tortoiseshell', 'matte-black', 'amber'], styles: ['streetwear', 'chic', 'resort'], occasions: ['casual', 'weekend', 'travel'], seasons: ['summer', 'all-season'], minP: 1999, maxP: 4999 },
    { subcat: 'watch', prefix: 'Minimalist Chronograph Mesh-Strap Watch', colors: ['silver-black', 'rose-gold', 'gunmetal'], styles: ['formal', 'smart-casual', 'minimalist'], occasions: ['workwear', 'formal', 'dateNight'], seasons: ['all-season'], minP: 4999, maxP: 12999 },
    { subcat: 'belt', prefix: 'Reversible Italian Full-Grain Leather Belt', colors: ['black-brown', 'tan'], styles: ['formal', 'smart-casual'], occasions: ['workwear', 'formal', 'casual'], seasons: ['all-season'], minP: 1499, maxP: 2999 },
    { subcat: 'necklace', prefix: 'Layered Dainty 18K Gold-Plated Chain', colors: ['gold', 'silver'], styles: ['chic', 'minimalist'], occasions: ['party', 'dateNight', 'casual'], seasons: ['all-season'], minP: 1299, maxP: 3499 },
    { subcat: 'scarf', prefix: 'Pure Mulberry Silk Printed Twill Scarf', colors: ['jewel-tones', 'navy-gold', 'pastel'], styles: ['chic', 'vintage', 'luxury'], occasions: ['formal', 'travel', 'workwear'], seasons: ['winter', 'all-season'], minP: 1799, maxP: 3999 }
  ],
  traditional: [
    { subcat: 'kurta', prefix: 'Embroidered Chanderi Silk Kurta', colors: ['mustard-yellow', 'maroon', 'ivory', 'emerald', 'sky-blue'], styles: ['ethnic', 'traditional', 'festive'], occasions: ['festival', 'wedding', 'casual'], seasons: ['all-season', 'summer'], minP: 2499, maxP: 5999 },
    { subcat: 'saree', prefix: 'Handwoven Banarasi Zari Border Saree', colors: ['royal-blue', 'crimson', 'bottle-green', 'purple', 'magenta'], styles: ['traditional', 'ethnic', 'royal'], occasions: ['wedding', 'festival', 'formal'], seasons: ['all-season'], minP: 5999, maxP: 18999 },
    { subcat: 'sherwani', prefix: 'Intricate Threadwork Royal Sherwani', colors: ['ivory-gold', 'midnight-blue', 'deep-wine'], styles: ['traditional', 'regal', 'formal'], occasions: ['wedding', 'festival'], seasons: ['winter', 'all-season'], minP: 11999, maxP: 29999 },
    { subcat: 'lehenga', prefix: 'Mirrored Georgette Flared Lehenga Choli', colors: ['ruby-pink', 'peacock-teal', 'gold', 'emerald'], styles: ['ethnic', 'glamour', 'festive'], occasions: ['wedding', 'festival', 'party'], seasons: ['all-season'], minP: 9999, maxP: 27999 },
    { subcat: 'nehru-jacket', prefix: 'Raw Silk Tailored Bandhgala Nehru Jacket', colors: ['slate-grey', 'mustard', 'black', 'navy'], styles: ['ethnic', 'smart-casual', 'formal'], occasions: ['festival', 'wedding', 'formal'], seasons: ['all-season'], minP: 3499, maxP: 7999 },
    { subcat: 'kimono', prefix: 'Traditional Silk Floral Motif Kimono', colors: ['cherry-blossom', 'indigo-white', 'crimson'], styles: ['traditional', 'cultural'], occasions: ['festival', 'wedding', 'formal'], seasons: ['all-season'], minP: 8999, maxP: 21999 },
    { subcat: 'anarkali', prefix: 'Floor-Length Embroidered Anarkali Suit', colors: ['powder-blue', 'wine', 'dusty-rose'], styles: ['ethnic', 'festive', 'traditional'], occasions: ['festival', 'wedding', 'party'], seasons: ['all-season'], minP: 4999, maxP: 11999 }
  ]
};

// ============================================================================
// 3. GENERATE ~812 MASTER CATALOGUE PRODUCTS (ZERO DUPLICATE IMAGES)
// ============================================================================
console.log('Generating master catalogue products (~812 products)...');
const products: any[] = [];
let prodIndex = 1;

// Target: 116 products per category = 812 products total
const ITEMS_PER_CATEGORY = 116;

CATEGORIES.forEach((cat) => {
  const catAssets = CURATED_ASSETS[cat] || [];
  if (catAssets.length < ITEMS_PER_CATEGORY) {
    console.warn(`Category ${cat} has only ${catAssets.length} assets, needed ${ITEMS_PER_CATEGORY}`);
  }

  const templates = SUBCATEGORIES[cat];

  for (let i = 0; i < ITEMS_PER_CATEGORY; i++) {
    const tpl = templates[i % templates.length];
    const color = tpl.colors[i % tpl.colors.length];
    const store = STORES[i % STORES.length];
    const rawImageUrl = catAssets[i % catAssets.length];
    // Ensure clean display URL
    const imageUrl = `${rawImageUrl}?auto=format&fit=crop&w=600&q=80`;

    const productId = `P${String(prodIndex).padStart(4, '0')}`;
    const name = `${tpl.prefix} in ${color.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`;
    const price = Math.round((tpl.minP + (i * 37) % (tpl.maxP - tpl.minP)) / 50) * 50;

    const prodDoc = {
      productId,
      name,
      category: cat,
      subcategory: tpl.subcat,
      color: color.split('-')[0],
      secondaryColor: color.includes('-') ? color.split('-')[1] : undefined,
      brand: store,
      style: tpl.styles[0],
      styleTags: tpl.styles,
      occasion: tpl.occasions,
      season: tpl.seasons,
      weatherSuitability: cat === 'outerwear' ? ['cold', 'rain'] : ['mild', 'warm'],
      price,
      store,
      imageUrl,
      thumbnailUrl: imageUrl.replace('w=600', 'w=200'),
      imageHash: crypto.createHash('sha256').update(rawImageUrl).digest('hex').substring(0, 16),
      imageStatus: 'verified',
      isTraditional: cat === 'traditional',
      available: true,
      tags: [cat, tpl.subcat, color, ...tpl.styles],
      createdAt: new Date(Date.now() - (812 - prodIndex) * 3600000).toISOString(),
    };

    products.push(prodDoc);
    prodIndex++;
  }
});

console.log(`Generated ${products.length} master products.`);

// Verify uniqueness of Product IDs and Image URLs
const prodIdSet = new Set(products.map((p) => p.productId));
const imageUrlSet = new Set(products.map((p) => p.imageUrl));
console.log(`Product ID uniqueness: ${prodIdSet.size} / ${products.length}`);
console.log(`Product Image uniqueness: ${imageUrlSet.size} / ${products.length}`);
if (prodIdSet.size !== products.length || imageUrlSet.size !== products.length) {
  throw new Error('Image URL or Product ID duplication detected in generated catalogue!');
}

fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(products, null, 2), 'utf8');

// ============================================================================
// 4. LOAD & PRESERVE CUSTOM ITEMS AND LEGACY NORMALIZATION
// ============================================================================
console.log('Normalizing legacy wardrobe records and preserving custom items...');
const existingWardrobesPath = path.join(dataDir, 'wardrobes.json');
let existingWardrobes: any[] = [];
if (fs.existsSync(existingWardrobesPath)) {
  existingWardrobes = JSON.parse(fs.readFileSync(existingWardrobesPath, 'utf8'));
}

// 12 custom items (C001-C012)
const preservedCustomItems: Record<string, any[]> = {};
// Normalized legacy items (C013-C025)
const normalizedLegacyItems: Record<string, any[]> = {};

existingWardrobes.forEach((item) => {
  const cust = item.customerId;
  if (!cust) return;

  // Check if legacy schema
  const isLegacy = item.style !== undefined || item.occasions !== undefined || item.seasons !== undefined || item.lastWorn !== undefined;

  if (isLegacy) {
    // Normalize into modern schema
    const norm = {
      itemId: item.itemId,
      customerId: item.customerId,
      productId: item.productId || undefined,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory || (item.name.toLowerCase().includes('shirt') ? 'shirt' : 'casual-item'),
      color: item.color || 'blue',
      style: item.style || 'casual',
      styleTags: item.style ? [item.style] : ['casual'],
      occasion: Array.isArray(item.occasions) ? item.occasions : [item.occasions || 'casual'],
      season: Array.isArray(item.seasons) ? item.seasons : [item.seasons || 'all-season'],
      price: item.price || 2499,
      store: item.store || 'Wardrobe Custom',
      imageUrl: item.imageUrl,
      dateAcquired: item.lastWorn ? item.lastWorn.split('T')[0] : '2025-01-15',
      isCustom: true,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!normalizedLegacyItems[cust]) normalizedLegacyItems[cust] = [];
    normalizedLegacyItems[cust].push(norm);
  } else if (item.isCustom === true) {
    if (!preservedCustomItems[cust]) preservedCustomItems[cust] = [];
    preservedCustomItems[cust].push(item);
  }
});

let totalPreservedCustom = 0;
Object.values(preservedCustomItems).forEach((arr) => (totalPreservedCustom += arr.length));
let totalNormalizedLegacy = 0;
Object.values(normalizedLegacyItems).forEach((arr) => (totalNormalizedLegacy += arr.length));
console.log(`Preserved ${totalPreservedCustom} custom items and normalized ${totalNormalizedLegacy} legacy items.`);

// ============================================================================
// 5. GENERATE 7,350 WARDROBE RECORDS (105 PERSONAS × 70 RECORDS)
// ============================================================================
console.log('Generating 7,350 wardrobe records across 105 personas (exactly 10 per category)...');
const wardrobes: any[] = [];
let wardrobeItemCounter = 1;

// Group master products by category for fast assignment
const productsByCat: Record<Category, any[]> = {
  top: products.filter((p) => p.category === 'top'),
  bottom: products.filter((p) => p.category === 'bottom'),
  dress: products.filter((p) => p.category === 'dress'),
  outerwear: products.filter((p) => p.category === 'outerwear'),
  shoes: products.filter((p) => p.category === 'shoes'),
  accessory: products.filter((p) => p.category === 'accessory'),
  traditional: products.filter((p) => p.category === 'traditional'),
};

const ITEMS_PER_CATEGORY_PER_PERSONA = 10;

for (let pNum = 1; pNum <= 105; pNum++) {
  const custId = `C${String(pNum).padStart(3, '0')}`;
  const personaCustom = preservedCustomItems[custId] || [];
  const personaLegacy = normalizedLegacyItems[custId] || [];
  const existingSpecial = [...personaCustom, ...personaLegacy];

  // For each of the 7 categories: exactly 10 items
  for (const cat of CATEGORIES) {
    const specialInCat = existingSpecial.filter((item) => item.category === cat).slice(0, ITEMS_PER_CATEGORY_PER_PERSONA);
    // Add existing special items first
    specialInCat.forEach((spec) => {
      wardrobes.push({
        ...spec,
        customerId: custId,
        isCustom: true,
      });
    });

    const neededFromCatalogue = ITEMS_PER_CATEGORY_PER_PERSONA - specialInCat.length;
    const catProds = productsByCat[cat];

    // Select products cyclically with persona-based offset so each persona has their own curated mix
    const offset = (pNum * 7 + CATEGORIES.indexOf(cat) * 13) % catProds.length;

    for (let k = 0; k < neededFromCatalogue; k++) {
      const prod = catProds[(offset + k) % catProds.length];
      const itemId = `W_${custId}_${cat}_${String(k + 1).padStart(3, '0')}`;
      const acquiredDate = new Date(Date.now() - (k * 3 + pNum) * 86400000).toISOString().split('T')[0];

      const itemDoc = {
        itemId,
        customerId: custId,
        productId: prod.productId,
        name: prod.name,
        category: prod.category,
        subcategory: prod.subcategory,
        color: prod.color,
        secondaryColor: prod.secondaryColor,
        brand: prod.brand,
        style: prod.style,
        styleTags: prod.styleTags,
        occasion: prod.occasion,
        season: prod.season,
        weatherSuitability: prod.weatherSuitability,
        price: prod.price,
        store: prod.store,
        imageUrl: prod.imageUrl,
        thumbnailUrl: prod.thumbnailUrl,
        imageHash: prod.imageHash,
        imageStatus: 'verified',
        dateAcquired: acquiredDate,
        isCustom: false,
        favorite: (k + pNum) % 15 === 0,
        createdAt: new Date(Date.now() - (k * 3 + pNum) * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      };

      wardrobes.push(itemDoc);
      wardrobeItemCounter++;
    }
  }
}

console.log(`Generated ${wardrobes.length} total wardrobe records.`);
fs.writeFileSync(path.join(dataDir, 'wardrobes.json'), JSON.stringify(wardrobes, null, 2), 'utf8');

// ============================================================================
// 6. GENERATE REALISTIC PURCHASES (20-60 PER PERSONA, 0 FOR NEW USERS)
// ============================================================================
console.log('Generating realistic purchase histories (20-60 per demo persona)...');
const purchases: any[] = [];
let purchaseCounter = 1;

for (let pNum = 1; pNum <= 105; pNum++) {
  const custId = `C${String(pNum).padStart(3, '0')}`;
  // 20-60 purchases
  const numPurchases = 25 + ((pNum * 7) % 35);

  for (let j = 0; j < numPurchases; j++) {
    // Select from catalogue
    const prod = products[(pNum * 13 + j * 17) % products.length];
    const isReturned = j % 20 === 0;
    const discountFactor = 0.8 + ((j % 5) * 0.05); // 10-20% discounts
    const pricePaid = Math.round(prod.price * discountFactor);
    const purchaseDate = new Date(Date.now() - (j * 10 + 2) * 86400000).toISOString();

    const purchaseDoc = {
      purchaseId: `PUR_${String(purchaseCounter).padStart(6, '0')}`,
      customerId: custId,
      productId: prod.productId,
      productName: prod.name,
      category: prod.category,
      subcategory: prod.subcategory,
      quantity: j % 15 === 0 ? 2 : 1,
      price: prod.price,
      pricePaid,
      store: prod.store,
      purchaseDate,
      season: prod.season[0] || 'all-season',
      occasion: prod.occasion[0] || 'casual',
      status: isReturned ? 'returned' : 'completed',
      createdAt: purchaseDate,
    };

    purchases.push(purchaseDoc);
    purchaseCounter++;
  }
}

console.log(`Generated ${purchases.length} purchase records across 105 personas.`);
fs.writeFileSync(path.join(dataDir, 'purchases.json'), JSON.stringify(purchases, null, 2), 'utf8');

// ============================================================================
// 7. GENERATE REALISTIC BROWSING INTERACTIONS
// ============================================================================
console.log('Generating realistic browsing telemetry records...');
const browsingEvents: any[] = [];
let eventCounter = 1;
const EVENT_TYPES = ['VIEW', 'CLICK', 'SEARCH', 'SAVE', 'WISHLIST', 'ADD_TO_WARDROBE', 'REMOVE_FROM_WISHLIST'] as const;

for (let pNum = 1; pNum <= 105; pNum++) {
  const custId = `C${String(pNum).padStart(3, '0')}`;
  const numEvents = 30 + ((pNum * 9) % 40);

  for (let j = 0; j < numEvents; j++) {
    const prod = products[(pNum * 23 + j * 7) % products.length];
    const eventType = EVENT_TYPES[j % EVENT_TYPES.length];
    const eventDate = new Date(Date.now() - (j * 12 + 1) * 3600000).toISOString();

    const browsingDoc = {
      interactionId: `INT_${String(eventCounter).padStart(6, '0')}`,
      customerId: custId,
      productId: eventType === 'SEARCH' ? undefined : prod.productId,
      eventType,
      timestamp: eventDate,
      category: prod.category,
      searchQuery: eventType === 'SEARCH' ? `${prod.color} ${prod.subcategory}` : undefined,
      sessionId: `sess_${custId}_${Math.floor(j / 5)}`,
      source: 'explore',
      viewCount: 1,
    };

    browsingEvents.push(browsingDoc);
    eventCounter++;
  }
}

console.log(`Generated ${browsingEvents.length} browsing interaction records.`);
fs.writeFileSync(path.join(dataDir, 'browsing_history.json'), JSON.stringify(browsingEvents, null, 2), 'utf8');

console.log('Dataset generation and normalization completed successfully!');
