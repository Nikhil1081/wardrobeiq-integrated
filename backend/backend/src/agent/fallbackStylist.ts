import { ExtractedQueryIntent } from './state.js';
import { Category, Occasion, Season, CustomerDocument } from '../types/domain.js';
import { RecommendationDTO, GapDTO, OutfitDTO } from '../types/dto.js';

export function deterministicParseQuery(text: string): ExtractedQueryIntent {
  const query = text.toLowerCase();
  const intent: ExtractedQueryIntent = {};

  // Category detection
  if (/\b(jacket|coat|hoodie|blazer|cardigan|outerwear|shrug)\b/.test(query)) intent.category = 'outerwear';
  else if (/\b(shirt|t-shirt|tshirt|top|blouse|crop|polo|tee)\b/.test(query)) intent.category = 'top';
  else if (/\b(pant|pants|jeans|trousers|chinos|skirt|bottom|shorts)\b/.test(query)) intent.category = 'bottom';
  else if (/\b(dress|gown|maxi|midi)\b/.test(query)) intent.category = 'dress';
  else if (/\b(shoe|shoes|sneaker|sneakers|boots|loafers|heels|flats)\b/.test(query)) intent.category = 'shoes';
  else if (/\b(bag|belt|watch|accessory|sunglasses|scarf)\b/.test(query)) intent.category = 'accessory';

  // Occasion detection
  if (/\b(college|campus|class|university)\b/.test(query)) intent.occasion = 'college';
  else if (/\b(work|office|interview|business|formal|meeting)\b/.test(query)) intent.occasion = 'workwear';
  else if (/\b(date|dinner|night|evening)\b/.test(query)) intent.occasion = 'dateNight';
  else if (/\b(party|club|fest|celebration)\b/.test(query)) intent.occasion = 'party';
  else if (/\b(weekend|brunch|outing)\b/.test(query)) intent.occasion = 'weekend';
  else if (/\b(casual|daily|everyday)\b/.test(query)) intent.occasion = 'casual';

  // Season detection
  if (/\b(winter|cold|chill)\b/.test(query)) intent.season = 'winter';
  else if (/\b(monsoon|rain|rainy)\b/.test(query)) intent.season = 'monsoon';
  else if (/\b(summer|hot|sunny)\b/.test(query)) intent.season = 'summer';

  // Budget detection (e.g. "under 1500", "below 2000", "< 3000")
  const budgetMatch = query.match(/(?:under|below|budget\s*(?:of)?|less\s*than|within)\s*(?:rs\.?|₹)?\s*(\d+)/i);
  if (budgetMatch && budgetMatch[1]) {
    intent.budget = parseInt(budgetMatch[1], 10);
  }

  // Color detection
  const colors = ['black', 'white', 'blue', 'beige', 'grey', 'gray', 'brown', 'green', 'red', 'navy', 'olive', 'pink'];
  for (const c of colors) {
    if (new RegExp(`\\b${c}\\b`).test(query)) {
      intent.color = c;
      break;
    }
  }

  // Style detection
  if (/\b(streetwear|urban)\b/.test(query)) intent.style = 'streetwear';
  else if (/\b(formal|smart)\b/.test(query)) intent.style = 'formal';
  else if (/\b(minimal|minimalist)\b/.test(query)) intent.style = 'minimalist';
  else if (/\b(ethnic|traditional)\b/.test(query)) intent.style = 'ethnic';
  else if (/\b(casual)\b/.test(query)) intent.style = 'casual';

  // Check if outfit requested
  if (/\b(outfit|look|pair|complete look|ensemble)\b/.test(query)) {
    intent.wantsOutfit = true;
  }

  return intent;
}

export function generateDeterministicStylistResponse(
  customer: CustomerDocument,
  query: string,
  gaps: GapDTO[],
  recommendations: RecommendationDTO[],
  outfits: OutfitDTO[]
): string {
  const name = customer.name.split(' ')[0] || 'there';
  const topGap = gaps[0];
  const topRec = recommendations[0];

  let text = `Hi ${name}! I reviewed your closet and recent preferences. `;

  if (topGap && (!query || query.length < 5)) {
    text += `Your highest priority wardrobe gap right now is **${topGap.label}** (${topGap.priority.replace('_', ' ')} priority). `;
  }

  if (topRec) {
    text += `I found **${topRec.name}** (₹${topRec.price}) which ${topRec.whyThis} `;
    if (topRec.applicableOffer) {
      text += `Plus, you have a **${topRec.applicableOffer.label}** offer applicable! `;
    }
  } else {
    text += `I've personalized several styling recommendations that complement your existing wardrobe. `;
  }

  if (outfits && outfits.length > 0) {
    const outfit = outfits[0];
    const closetCount = outfit.items.filter((i) => i.source === 'wardrobe').length;
    text += `I also built a complete **${outfit.occasion}** look for you combining ${closetCount} piece(s) from your closet with curated additions.`;
  }

  return text;
}
