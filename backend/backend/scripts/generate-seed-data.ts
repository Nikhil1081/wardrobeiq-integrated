import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 1. Curated Realistic Products (600+ Products)
const STORES = ['Zara', 'H&M', 'Uniqlo', 'FabIndia', 'Mango', "Levi's", 'Nike', 'Marks & Spencer', 'Westside', 'Snitch', 'Biba', 'Allen Solly'];
const OCCASIONS = ['casual', 'college', 'workwear', 'dateNight', 'weekend', 'party'] as const;
const SEASONS = ['summer', 'monsoon', 'winter', 'all-season'] as const;
const STYLES = ['casual', 'formal', 'smart-casual', 'streetwear', 'ethnic', 'minimalist'] as const;

interface ItemTemplate {
  subcat: string;
  nameTpl: string;
  colors: string[];
  styles: string[];
  occasions: (typeof OCCASIONS)[number][];
  seasons: (typeof SEASONS)[number][];
  minPrice: number;
  maxPrice: number;
  imageUrls: string[];
}

const CATEGORY_TEMPLATES: Record<string, ItemTemplate[]> = {
  top: [
    {
      subcat: 'shirt',
      nameTpl: 'Relaxed Fit Linen Shirt',
      colors: ['white', 'beige', 'blue', 'olive', 'black'],
      styles: ['smart-casual', 'casual', 'minimalist'],
      occasions: ['workwear', 'weekend', 'college'],
      seasons: ['summer', 'all-season'],
      minPrice: 1299,
      maxPrice: 2799,
      imageUrls: [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 't-shirt',
      nameTpl: 'Heavyweight Oversized Cotton Tee',
      colors: ['black', 'white', 'grey', 'charcoal', 'navy'],
      styles: ['streetwear', 'casual', 'minimalist'],
      occasions: ['college', 'casual', 'weekend'],
      seasons: ['all-season', 'summer'],
      minPrice: 699,
      maxPrice: 1499,
      imageUrls: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'polo',
      nameTpl: 'Fine Pique Cotton Polo',
      colors: ['navy', 'burgundy', 'white', 'black', 'green'],
      styles: ['smart-casual', 'casual'],
      occasions: ['workwear', 'college', 'weekend'],
      seasons: ['all-season', 'summer'],
      minPrice: 999,
      maxPrice: 1999,
      imageUrls: [
        'https://images.unsplash.com/photo-1625910513413-568393c528f1?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'blouse',
      nameTpl: 'Satin Bow Collar Blouse',
      colors: ['cream', 'champagne', 'emerald', 'black'],
      styles: ['formal', 'smart-casual'],
      occasions: ['workwear', 'dateNight', 'party'],
      seasons: ['all-season'],
      minPrice: 1499,
      maxPrice: 2999,
      imageUrls: [
        'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'knitwear',
      nameTpl: 'Ribbed Merino Crewneck Sweater',
      colors: ['camel', 'grey', 'navy', 'olive'],
      styles: ['smart-casual', 'minimalist'],
      occasions: ['workwear', 'casual', 'dateNight'],
      seasons: ['winter', 'monsoon'],
      minPrice: 1899,
      maxPrice: 3499,
      imageUrls: [
        'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?auto=format&fit=crop&w=600&q=80',
      ],
    },
  ],
  bottom: [
    {
      subcat: 'chinos',
      nameTpl: 'Slim Stretch Cotton Chinos',
      colors: ['beige', 'navy', 'olive', 'khaki', 'black'],
      styles: ['smart-casual', 'casual', 'formal'],
      occasions: ['workwear', 'college', 'weekend'],
      seasons: ['all-season', 'summer'],
      minPrice: 1499,
      maxPrice: 2699,
      imageUrls: [
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'jeans',
      nameTpl: 'Straight Fit Washed Selvedge Denim',
      colors: ['blue', 'dark-blue', 'black', 'grey'],
      styles: ['casual', 'streetwear'],
      occasions: ['college', 'casual', 'weekend'],
      seasons: ['all-season'],
      minPrice: 1799,
      maxPrice: 3499,
      imageUrls: [
        'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'trousers',
      nameTpl: 'Pleated Tailored Wool Trousers',
      colors: ['charcoal', 'grey', 'brown', 'black', 'navy'],
      styles: ['formal', 'smart-casual'],
      occasions: ['workwear', 'dateNight'],
      seasons: ['winter', 'all-season'],
      minPrice: 2199,
      maxPrice: 3999,
      imageUrls: [
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'cargo',
      nameTpl: 'Relaxed Utility Cargo Pants',
      colors: ['olive', 'black', 'khaki'],
      styles: ['streetwear', 'casual'],
      occasions: ['college', 'casual', 'weekend'],
      seasons: ['all-season', 'monsoon'],
      minPrice: 1399,
      maxPrice: 2499,
      imageUrls: [
        'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=600&q=80',
      ],
    },
  ],
  dress: [
    {
      subcat: 'wrap-dress',
      nameTpl: 'Floral Printed Wrap Midi Dress',
      colors: ['red', 'navy', 'green', 'yellow'],
      styles: ['casual', 'smart-casual'],
      occasions: ['weekend', 'dateNight', 'casual'],
      seasons: ['summer', 'all-season'],
      minPrice: 1899,
      maxPrice: 3499,
      imageUrls: [
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'slip-dress',
      nameTpl: 'Minimalist Silk Slip Dress',
      colors: ['black', 'emerald', 'champagne', 'burgundy'],
      styles: ['minimalist', 'smart-casual'],
      occasions: ['dateNight', 'party'],
      seasons: ['all-season', 'summer'],
      minPrice: 2299,
      maxPrice: 4299,
      imageUrls: [
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'shirt-dress',
      nameTpl: 'Belted Cotton Poplin Shirt Dress',
      colors: ['white', 'blue', 'beige', 'olive'],
      styles: ['smart-casual', 'formal'],
      occasions: ['workwear', 'college', 'weekend'],
      seasons: ['summer', 'all-season'],
      minPrice: 1999,
      maxPrice: 3199,
      imageUrls: [
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
      ],
    },
  ],
  outerwear: [
    {
      subcat: 'jacket',
      nameTpl: 'Classic Denim Trucker Jacket',
      colors: ['blue', 'black', 'grey', 'white'],
      styles: ['casual', 'streetwear'],
      occasions: ['college', 'casual', 'weekend'],
      seasons: ['monsoon', 'winter', 'all-season'],
      minPrice: 1999,
      maxPrice: 3999,
      imageUrls: [
        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'blazer',
      nameTpl: 'Structured Tailored Wool-Blend Blazer',
      colors: ['navy', 'charcoal', 'black', 'beige', 'brown'],
      styles: ['formal', 'smart-casual'],
      occasions: ['workwear', 'dateNight', 'party'],
      seasons: ['winter', 'all-season'],
      minPrice: 3499,
      maxPrice: 6999,
      imageUrls: [
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'trench',
      nameTpl: 'Water-Resistant Double Breasted Trench Coat',
      colors: ['beige', 'khaki', 'black', 'navy'],
      styles: ['smart-casual', 'formal', 'minimalist'],
      occasions: ['workwear', 'weekend', 'dateNight'],
      seasons: ['monsoon', 'winter'],
      minPrice: 3999,
      maxPrice: 7999,
      imageUrls: [
        'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'bomber',
      nameTpl: 'Flight Satin Utility Bomber Jacket',
      colors: ['olive', 'black', 'navy', 'burgundy'],
      styles: ['streetwear', 'casual'],
      occasions: ['college', 'casual', 'weekend'],
      seasons: ['winter', 'monsoon'],
      minPrice: 2499,
      maxPrice: 4499,
      imageUrls: [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
      ],
    },
  ],
  shoes: [
    {
      subcat: 'sneakers',
      nameTpl: 'Low-Top Minimal Leather Sneakers',
      colors: ['white', 'black', 'grey', 'beige'],
      styles: ['casual', 'streetwear', 'minimalist'],
      occasions: ['college', 'casual', 'weekend'],
      seasons: ['all-season', 'summer'],
      minPrice: 1899,
      maxPrice: 3999,
      imageUrls: [
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'loafers',
      nameTpl: 'Classic Italian Leather Penny Loafers',
      colors: ['brown', 'black', 'tan', 'burgundy'],
      styles: ['smart-casual', 'formal'],
      occasions: ['workwear', 'dateNight', 'party'],
      seasons: ['all-season'],
      minPrice: 2999,
      maxPrice: 5999,
      imageUrls: [
        'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'boots',
      nameTpl: 'Suede Chelsea Ankle Boots',
      colors: ['tan', 'black', 'brown', 'grey'],
      styles: ['smart-casual', 'streetwear'],
      occasions: ['weekend', 'dateNight', 'casual'],
      seasons: ['winter', 'monsoon'],
      minPrice: 3299,
      maxPrice: 6499,
      imageUrls: [
        'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'oxfords',
      nameTpl: 'Cap-Toe Leather Formal Oxfords',
      colors: ['black', 'dark-brown'],
      styles: ['formal'],
      occasions: ['workwear', 'party'],
      seasons: ['all-season'],
      minPrice: 3499,
      maxPrice: 6999,
      imageUrls: [
        'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=600&q=80',
      ],
    },
  ],
  accessory: [
    {
      subcat: 'watch',
      nameTpl: 'Minimalist Sapphire Dial Watch',
      colors: ['silver', 'black', 'gold', 'brown'],
      styles: ['smart-casual', 'formal', 'minimalist'],
      occasions: ['workwear', 'dateNight', 'weekend'],
      seasons: ['all-season'],
      minPrice: 2499,
      maxPrice: 7999,
      imageUrls: [
        'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'bag',
      nameTpl: 'Full-Grain Leather Messenger Bag',
      colors: ['brown', 'black', 'tan'],
      styles: ['smart-casual', 'formal'],
      occasions: ['workwear', 'college'],
      seasons: ['all-season'],
      minPrice: 2799,
      maxPrice: 5999,
      imageUrls: [
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'sunglasses',
      nameTpl: 'Vintage Tortoiseshell Polarized Sunglasses',
      colors: ['brown', 'black', 'amber'],
      styles: ['casual', 'streetwear', 'minimalist'],
      occasions: ['weekend', 'casual', 'college'],
      seasons: ['summer', 'all-season'],
      minPrice: 999,
      maxPrice: 2499,
      imageUrls: [
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80',
      ],
    },
    {
      subcat: 'belt',
      nameTpl: 'Reversible Italian Full-Grain Belt',
      colors: ['black', 'brown', 'tan'],
      styles: ['formal', 'smart-casual'],
      occasions: ['workwear', 'dateNight'],
      seasons: ['all-season'],
      minPrice: 799,
      maxPrice: 1799,
      imageUrls: [
        'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=600&q=80',
      ],
    },
  ],
};

console.log('Generating 600+ realistic products across 6 categories...');
const products: any[] = [];
let pIdx = 1;

// Counts to hit ~650 total
const targetCounts: Record<string, number> = {
  top: 170,
  bottom: 130,
  dress: 65,
  outerwear: 85,
  shoes: 110,
  accessory: 90,
};

for (const [category, templates] of Object.entries(CATEGORY_TEMPLATES)) {
  const target = targetCounts[category] || 100;
  let current = 0;

  while (current < target) {
    for (const tpl of templates) {
      if (current >= target) break;

      for (const color of tpl.colors) {
        if (current >= target) break;

        const store = STORES[Math.floor(Math.random() * STORES.length)];
        const price = Math.round((tpl.minPrice + Math.random() * (tpl.maxPrice - tpl.minPrice)) / 50) * 50;
        const discountRate = Math.random() > 0.6 ? 0.15 + Math.random() * 0.25 : 0;
        const originalPrice = discountRate > 0 ? Math.round((price / (1 - discountRate)) / 50) * 50 : price;

        const pId = `P${String(pIdx).padStart(4, '0')}`;
        const name = `${color.charAt(0).toUpperCase() + color.slice(1)} ${tpl.nameTpl}`;
        const img = tpl.imageUrls[Math.floor(Math.random() * tpl.imageUrls.length)];

        products.push({
          productId: pId,
          name,
          category,
          subcategory: tpl.subcat,
          color,
          styleTags: Array.from(new Set([...tpl.styles, Math.random() > 0.7 ? 'trending' : 'basic'])),
          occasion: tpl.occasions,
          season: tpl.seasons,
          price,
          originalPrice,
          store,
          imageUrl: img,
          available: true,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 86400000)).toISOString(),
        });

        pIdx++;
        current++;
      }
    }
  }
}

console.log(`Generated ${products.length} products.`);

// 2. Customers (12 Distinct Gap Archetypes)
const customers = [
  {
    customerId: 'C001',
    name: 'Aarav Sharma',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    preferredStyles: ['streetwear', 'casual'],
    preferredColors: ['black', 'white', 'grey'],
    avoidedColors: ['neon', 'pink'],
    budget: 2500,
    preferredOccasions: ['college', 'casual'],
    currentSeason: 'winter',
    createdAt: '2025-10-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    customerId: 'C002',
    name: 'Diya Patel',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    preferredStyles: ['minimalist', 'casual'],
    preferredColors: ['black', 'grey'],
    avoidedColors: ['yellow', 'orange'],
    budget: 3500,
    preferredOccasions: ['workwear', 'weekend'],
    currentSeason: 'summer',
    createdAt: '2025-10-05T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    customerId: 'C003',
    name: 'Rohan Verma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    preferredStyles: ['smart-casual', 'casual'],
    preferredColors: ['navy', 'beige', 'white'],
    avoidedColors: ['red'],
    budget: 2000,
    preferredOccasions: ['college', 'workwear'],
    currentSeason: 'monsoon',
    createdAt: '2025-11-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    customerId: 'C004',
    name: 'Ananya Iyer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    preferredStyles: ['smart-casual', 'formal'],
    preferredColors: ['cream', 'emerald', 'black'],
    avoidedColors: ['neon'],
    budget: 4500,
    preferredOccasions: ['workwear', 'dateNight'],
    currentSeason: 'all-season',
    createdAt: '2025-11-10T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    customerId: 'C005',
    name: 'Kabir Mehta',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    preferredStyles: ['casual', 'minimalist'],
    preferredColors: ['olive', 'black', 'khaki'],
    avoidedColors: ['purple'],
    budget: 1500,
    preferredOccasions: ['casual', 'weekend'],
    currentSeason: 'monsoon',
    createdAt: '2025-12-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    customerId: 'C006',
    name: 'Meera Nair',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    preferredStyles: ['ethnic', 'fusion', 'casual'],
    preferredColors: ['red', 'mustard', 'white', 'black'],
    avoidedColors: [],
    budget: 3000,
    preferredOccasions: ['weekend', 'party', 'casual'],
    currentSeason: 'summer',
    createdAt: '2025-12-15T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    customerId: 'C007',
    name: 'Vikram Malhotra',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    preferredStyles: ['minimalist', 'formal'],
    preferredColors: ['black', 'grey', 'white'],
    avoidedColors: ['yellow'],
    budget: 5000,
    preferredOccasions: ['workwear', 'dateNight'],
    currentSeason: 'winter',
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    customerId: 'C008',
    name: 'Pooja Reddy',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    preferredStyles: ['casual', 'smart-casual'],
    preferredColors: ['blue', 'pink', 'white'],
    avoidedColors: ['black'],
    budget: 2800,
    preferredOccasions: ['casual', 'college'],
    currentSeason: 'summer',
    createdAt: '2026-01-20T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    customerId: 'C009',
    name: 'Arjun Das',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
    preferredStyles: ['streetwear', 'casual'],
    preferredColors: ['blue', 'black'],
    avoidedColors: ['green'],
    budget: 2200,
    preferredOccasions: ['college', 'casual'],
    currentSeason: 'all-season',
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    customerId: 'C010',
    name: 'Sanya Kapoor',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
    preferredStyles: ['minimalist', 'smart-casual', 'casual'],
    preferredColors: ['black', 'white', 'beige', 'navy'],
    avoidedColors: [],
    budget: 6000,
    preferredOccasions: ['workwear', 'casual', 'weekend', 'dateNight'],
    currentSeason: 'winter',
    createdAt: '2026-02-15T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    customerId: 'C011',
    name: 'Aditya Joshi',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80',
    preferredStyles: ['streetwear', 'casual'],
    preferredColors: ['black', 'white', 'grey'],
    avoidedColors: ['brown'],
    budget: 1800,
    preferredOccasions: ['college', 'weekend'],
    currentSeason: 'monsoon',
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    customerId: 'C012',
    name: 'Neha Gupta',
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=300&q=80',
    preferredStyles: ['smart-casual', 'formal'],
    preferredColors: ['champagne', 'black', 'white'],
    avoidedColors: ['neon'],
    budget: 7000,
    preferredOccasions: ['workwear', 'dateNight', 'party'],
    currentSeason: 'summer',
    createdAt: '2026-03-10T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
];

// 3. Wardrobe Records (220+ items linked to deliberate archetypes)
console.log('Generating deliberate wardrobe items for 12 customer archetypes...');
const wardrobes: any[] = [];
let itemIdx = 1;

// Helper to find products of category and styles
const getProds = (cat: string, color?: string) => {
  return products.filter((p) => p.category === cat && (!color || p.color === color));
};

for (const cust of customers) {
  let custItems: any[] = [];

  if (cust.customerId === 'C001') {
    // Outerwear Gap: 6 bottoms, 5 tops, 2 shoes, 0 outerwear
    const tops = getProds('top').slice(0, 5);
    const bottoms = getProds('bottom').slice(0, 6);
    const shoes = getProds('shoes').slice(0, 2);
    custItems = [...tops, ...bottoms, ...shoes];
  } else if (cust.customerId === 'C002') {
    // Low color diversity: all black/grey tops and bottoms, 0 dress
    const tops = getProds('top', 'black').slice(0, 5).concat(getProds('top', 'grey').slice(0, 3));
    const bottoms = getProds('bottom', 'black').slice(0, 4);
    const shoes = getProds('shoes', 'black').slice(0, 2);
    custItems = [...tops, ...bottoms, ...shoes];
  } else if (cust.customerId === 'C003') {
    // Workwear deficit: casual college items only, 0 workwear
    const tops = products.filter((p) => p.category === 'top' && p.occasion.includes('college')).slice(0, 5);
    const bottoms = products.filter((p) => p.category === 'bottom' && p.occasion.includes('college')).slice(0, 4);
    const shoes = getProds('shoes', 'white').slice(0, 2);
    custItems = [...tops, ...bottoms, ...shoes];
  } else if (cust.customerId === 'C004') {
    // Shoe gap: tops, bottoms, blazer, but only 1 worn sneaker
    const tops = getProds('top').slice(5, 10);
    const bottoms = getProds('bottom').slice(6, 10);
    const blazers = getProds('outerwear').slice(0, 2);
    const shoes = getProds('shoes').slice(0, 1);
    custItems = [...tops, ...bottoms, ...blazers, ...shoes];
  } else {
    // General distribution of 15-20 items
    const tops = getProds('top').slice(itemIdx % 50, (itemIdx % 50) + 6);
    const bottoms = getProds('bottom').slice(itemIdx % 40, (itemIdx % 40) + 5);
    const outerwear = getProds('outerwear').slice(itemIdx % 20, (itemIdx % 20) + 2);
    const shoes = getProds('shoes').slice(itemIdx % 30, (itemIdx % 30) + 3);
    const acc = getProds('accessory').slice(itemIdx % 25, (itemIdx % 25) + 2);
    custItems = [...tops, ...bottoms, ...outerwear, ...shoes, ...acc];
  }

  for (const prod of custItems) {
    wardrobes.push({
      itemId: `item_${String(itemIdx).padStart(5, '0')}`,
      customerId: cust.customerId,
      productId: prod.productId,
      name: prod.name,
      category: prod.category,
      subcategory: prod.subcategory,
      color: prod.color,
      styleTags: prod.styleTags,
      occasion: prod.occasion,
      season: prod.season,
      price: prod.price,
      store: prod.store,
      imageUrl: prod.imageUrl,
      dateAcquired: '2025-11-15',
      pricePaid: prod.price,
      isCustom: false,
      createdAt: '2025-11-15T12:00:00.000Z',
    });
    itemIdx++;
  }

  // Add 1 custom handmade/tailored item to test isCustom support
  wardrobes.push({
    itemId: `item_${String(itemIdx).padStart(5, '0')}`,
    customerId: cust.customerId,
    name: 'Custom Tailored Linen Shirt',
    category: 'top',
    subcategory: 'shirt',
    color: 'beige',
    styleTags: ['custom', 'smart-casual'],
    occasion: ['casual', 'workwear'],
    season: ['summer', 'all-season'],
    price: 1500,
    store: 'Bespoke Tailors',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
    dateAcquired: '2025-12-01',
    pricePaid: 1500,
    isCustom: true,
    createdAt: '2025-12-01T12:00:00.000Z',
  });
  itemIdx++;
}

console.log(`Generated ${wardrobes.length} wardrobe records.`);

// 4. Browsing Events (450+ Events across viewed, saved, added_to_cart, abandoned_cart)
console.log('Generating realistic browsing telemetry...');
const browsingEvents: any[] = [];
const eventTypes = ['viewed', 'viewed', 'saved', 'added_to_cart', 'abandoned_cart'] as const;

for (const cust of customers) {
  // Deliberately concentrate browsing on their gap categories
  let targetCat = 'outerwear';
  if (cust.customerId === 'C001') targetCat = 'outerwear';
  else if (cust.customerId === 'C002') targetCat = 'dress';
  else if (cust.customerId === 'C003') targetCat = 'bottom';
  else if (cust.customerId === 'C004') targetCat = 'shoes';

  const gapProds = products.filter((p) => p.category === targetCat).slice(0, 10);
  const generalProds = products.slice(0, 30);

  // 25-35 events per customer
  const count = 30 + Math.floor(Math.random() * 10);
  for (let i = 0; i < count; i++) {
    const isGapFocus = Math.random() > 0.4;
    const pool = isGapFocus && gapProds.length > 0 ? gapProds : generalProds;
    const prod = pool[Math.floor(Math.random() * pool.length)];
    const ev = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    browsingEvents.push({
      customerId: cust.customerId,
      productId: prod.productId,
      eventType: ev,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000)).toISOString(),
      viewCount: ev === 'viewed' ? 1 + Math.floor(Math.random() * 4) : 1,
    });
  }
}

console.log(`Generated ${browsingEvents.length} browsing telemetry records.`);

// 5. Offers (65+ offers: active, expired, category pair, minimum purchase)
console.log('Generating 65+ promotions and condition-bound offers...');
const offers: any[] = [];
const offerTypes = ['bundle_discount', 'percentage_off', 'free_shipping', 'seasonal_sale'] as const;

for (let i = 1; i <= 70; i++) {
  const prod = products[i * 8];
  if (!prod) continue;

  const oId = `O${String(i).padStart(3, '0')}`;
  const isExpired = i > 55; // 15 expired offers for validation testing
  const validUntil = isExpired
    ? '2025-12-31T23:59:59.000Z'
    : '2027-12-31T23:59:59.000Z';

  const oType = offerTypes[i % offerTypes.length];
  let condType: any = 'none';
  let condCat: any = undefined;
  let minPurchase: any = undefined;

  if (oType === 'bundle_discount') {
    condType = 'category_pair';
    condCat = prod.category === 'outerwear' ? 'bottom' : 'top';
  } else if (i % 3 === 0) {
    condType = 'minimum_purchase';
    minPurchase = 1999;
  }

  offers.push({
    offerId: oId,
    productId: prod.productId,
    offerType: oType,
    discountPercentage: 15 + (i % 4) * 5, // 15%, 20%, 25%, 30%
    conditionType: condType,
    conditionCategory: condCat,
    validUntil,
    minimumPurchase: minPurchase,
    active: !isExpired,
  });
}

console.log(`Generated ${offers.length} promotional offers.`);

// Write all datasets to data/
fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(products, null, 2));
fs.writeFileSync(path.join(dataDir, 'customers.json'), JSON.stringify(customers, null, 2));
fs.writeFileSync(path.join(dataDir, 'wardrobes.json'), JSON.stringify(wardrobes, null, 2));
fs.writeFileSync(path.join(dataDir, 'browsing_history.json'), JSON.stringify(browsingEvents, null, 2));
fs.writeFileSync(path.join(dataDir, 'offers.json'), JSON.stringify(offers, null, 2));

console.log('All synthetic datasets successfully written to backend/data/ directory.');
