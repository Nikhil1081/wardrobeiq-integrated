import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputFile = path.join(__dirname, '..', 'data', 'curated_fashion_assets.json');

const catQueries = {
  top: ['shirt', 't-shirt', 'blouse', 'top clothing', 'polo shirt', 'sweater', 'crop top', 'linen shirt', 'button up shirt'],
  bottom: ['jeans', 'trousers', 'pants', 'skirt', 'shorts', 'denim pants', 'chinos', 'cargo pants', 'slacks'],
  dress: ['dress', 'summer dress', 'evening gown', 'cocktail dress', 'maxi dress', 'floral dress', 'slip dress', 'formal dress'],
  outerwear: ['jacket', 'coat', 'blazer', 'hoodie', 'trench coat', 'cardigan', 'bomber jacket', 'leather jacket', 'parka', 'denim jacket'],
  shoes: ['sneakers', 'boots', 'heels', 'loafers', 'sandals', 'leather shoes', 'footwear', 'running shoes', 'dress shoes'],
  accessory: ['handbag', 'necklace', 'sunglasses', 'watch', 'hat', 'scarf', 'leather belt', 'jewelry', 'tote bag', 'earrings'],
  traditional: ['kurta', 'saree', 'lehenga', 'sherwani', 'kimono', 'traditional dress', 'ethnic wear', 'hanbok', 'kaftan', 'abaya', 'nehru jacket']
};

async function main() {
  const photoSet = new Set();
  const photosByCategory = {
    top: [],
    bottom: [],
    dress: [],
    outerwear: [],
    shoes: [],
    accessory: [],
    traditional: []
  };

  for (const [cat, qList] of Object.entries(catQueries)) {
    console.log(`Fetching photos for ${cat}...`);
    for (const q of qList) {
      if (photosByCategory[cat].length >= 130) break;
      for (let page = 1; page <= 4; page++) {
        if (photosByCategory[cat].length >= 130) break;
        try {
          const res = await fetch(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(q)}&per_page=30&page=${page}`);
          if (!res.ok) continue;
          const data = await res.json();
          const results = data.results || [];
          for (const item of results) {
            if (item.urls && item.urls.regular) {
              const rawUrl = item.urls.regular.split('?')[0];
              if (!photoSet.has(rawUrl)) {
                photoSet.add(rawUrl);
                photosByCategory[cat].push(rawUrl);
              }
            }
          }
        } catch (err) {
          // ignore
        }
      }
    }
    console.log(`Fetched ${photosByCategory[cat].length} unique photos for category: ${cat}`);
  }

  fs.writeFileSync(outputFile, JSON.stringify(photosByCategory, null, 2), 'utf8');
  console.log(`Done! Saved ${photoSet.size} unique base fashion photo URLs to ${outputFile}`);
}

main();
