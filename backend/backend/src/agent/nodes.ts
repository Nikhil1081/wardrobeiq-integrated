import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { env } from '../config/env.js';
import { AgentStateType } from './state.js';
import { deterministicParseQuery, generateDeterministicStylistResponse } from './fallbackStylist.js';
import { getCustomerProfile } from '../tools/customerTools.js';
import { getWardrobeItems, analyzeWardrobe } from '../tools/wardrobeTools.js';
import { detectGaps } from '../tools/gapTools.js';
import { getCustomerBrowsingSignals } from '../tools/browsingTools.js';
import { getRecommendationCandidates, toProductCardDTO } from '../tools/catalogueTools.js';
import { scoreProductCandidate } from '../tools/scoringTools.js';
import { getProductOffers, validateOfferConditions, toOfferDTO } from '../tools/offerTools.js';
import { generateOutfitLook } from '../tools/outfitTools.js';
import { RecommendationDTO } from '../types/dto.js';
import { Category, Occasion } from '../types/domain.js';
import { getAiConversationsCollection } from '../db/collections.js';

// Helper to check if OpenAI or Groq is usable
function getOpenAIClient(): ChatOpenAI | null {
  const groqKey = env.GROQ_API_KEY || (env.OPENAI_API_KEY?.startsWith('gsk_') ? env.OPENAI_API_KEY : undefined);
  if (groqKey && groqKey.trim() !== '') {
    return new ChatOpenAI({
      modelName: env.GROQ_MODEL || (env.OPENAI_MODEL?.startsWith('gpt-4') ? 'openai/gpt-oss-120b' : env.OPENAI_MODEL),
      apiKey: groqKey,
      configuration: {
        baseURL: 'https://api.groq.com/openai/v1',
      },
      temperature: 0.2,
    });
  }

  if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.trim() === '' || env.OPENAI_API_KEY.includes('your-key')) {
    return null;
  }
  return new ChatOpenAI({
    modelName: env.OPENAI_MODEL,
    openAIApiKey: env.OPENAI_API_KEY,
    temperature: 0.2,
  });
}

// 1. understand_request
export async function understandRequestNode(state: AgentStateType) {
  const query = state.message;
  let intent = deterministicParseQuery(query);

  const llm = getOpenAIClient();
  if (llm && query && query.length > 5) {
    try {
      const response = await llm.invoke([
        new SystemMessage(
          `You are an intent extractor for a fashion stylist. Return ONLY valid JSON with keys: category (top, bottom, dress, outerwear, shoes, accessory), occasion (casual, college, workwear, dateNight, weekend, party), budget (number), color (string), style (string). Do not add markdown or extra text.`
        ),
        new HumanMessage(query),
      ]);
      const content = typeof response.content === 'string' ? response.content.replace(/```json|```/g, '').trim() : '';
      const parsed = JSON.parse(content);
      intent = { ...intent, ...parsed };
    } catch {
      // Gracefully fall back to deterministic parse
    }
  }

  return {
    intent,
    processingSteps: ['Understanding request'],
  };
}

// 2. load_customer
export async function loadCustomerNode(state: AgentStateType) {
  const customer = await getCustomerProfile(state.customerId);
  return { customer };
}

// 3. load_wardrobe
export async function loadWardrobeNode(state: AgentStateType) {
  const wardrobe = await getWardrobeItems(state.customerId);
  return {
    wardrobe,
    processingSteps: ['Checking your closet'],
  };
}

// 4. analyze_wardrobe
export async function analyzeWardrobeNode(state: AgentStateType) {
  if (!state.wardrobe) return { analysis: null };
  const analysis = analyzeWardrobe(state.wardrobe, state.customer || undefined);
  return { analysis };
}

// 5. detect_gaps
export async function detectGapsNode(state: AgentStateType) {
  if (!state.analysis || !state.customer) return { gaps: [] };
  const gaps = detectGaps(state.analysis, state.customer, state.wardrobe || [], state.browsingSignals?.summary);
  return {
    gaps,
    processingSteps: ['Detecting wardrobe gaps'],
  };
}

// 6. load_browsing
export async function loadBrowsingNode(state: AgentStateType) {
  const browsingSignals = await getCustomerBrowsingSignals(state.customerId);
  return { browsingSignals };
}

// 7. parse_constraints
export async function parseConstraintsNode(state: AgentStateType) {
  // Constraints parsed in intent channel
  return {};
}

// 8. search_products
export async function searchProductsNode(state: AgentStateType) {
  if (!state.customer) return { candidateProducts: [] };

  const ownedProductIds = new Set((state.wardrobe || []).map((w) => w.productId).filter(Boolean) as string[]);
  const targetCategory = state.intent?.category;
  const budgetCeiling = state.intent?.budget;

  const candidateProducts = await getRecommendationCandidates(
    state.customer,
    ownedProductIds,
    targetCategory,
    budgetCeiling
  );

  return {
    candidateProducts,
    processingSteps: ['Finding compatible pieces'],
  };
}

// 9. filter_products
export async function filterProductsNode(state: AgentStateType) {
  const ownedProductIds = new Set((state.wardrobe || []).map((w) => w.productId).filter(Boolean) as string[]);
  const customer = state.customer;

  const filteredProducts = (state.candidateProducts || []).filter((prod) => {
    // 1. Strict owned exclusion
    if (ownedProductIds.has(prod.productId)) return false;

    // 2. Strict avoided color exclusion
    if (customer?.avoidedColors && customer.avoidedColors.length > 0) {
      if (customer.avoidedColors.some((c) => c.toLowerCase() === prod.color.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  return { filteredProducts };
}

// 10. rank_products
export async function rankProductsNode(state: AgentStateType) {
  if (!state.customer || !state.filteredProducts) return { rankedRecommendations: [] };

  const customer = state.customer;
  const gaps = state.gaps || [];
  const wardrobe = state.wardrobe || [];
  const browsingWeights = state.browsingSignals?.productWeights || new Map<string, number>();

  const scoredList = state.filteredProducts.map((prod) => {
    const browsingScore = browsingWeights.get(prod.productId) || 0;
    return scoreProductCandidate(prod, customer, gaps, wardrobe, browsingScore);
  });

  // Sort by finalScore descending
  scoredList.sort((a, b) => b.score - a.score);

  const topScored = scoredList.slice(0, 10);
  const rankedRecommendations: RecommendationDTO[] = topScored.map((item) => {
    const baseCard = toProductCardDTO(item.product);
    return {
      ...baseCard,
      score: item.score,
      scoreBreakdown: item.scoreBreakdown,
      whyThis: item.whyThis,
      compatibleWardrobeItems: item.compatibleWardrobeItems,
      filledGap: item.filledGap,
      applicableOffer: null, // to be populated in check_offers node
      isSaved: false,
      isInCloset: false,
      browsingSignal: browsingWeights.has(item.product.productId)
        ? { viewCount: browsingWeights.get(item.product.productId)!, lastEvent: 'viewed' }
        : undefined,
    };
  });

  return {
    rankedRecommendations,
    processingSteps: ['Ranking recommendations'],
  };
}

// 11. check_offers
export async function checkOffersNode(state: AgentStateType) {
  const recommendations = [...(state.rankedRecommendations || [])];
  const wardrobe = state.wardrobe || [];
  const matchedOffers: any[] = [];

  for (let i = 0; i < recommendations.length; i++) {
    const rec = recommendations[i];
    const offers = await getProductOffers(rec.productId);

    for (const offer of offers) {
      const validation = validateOfferConditions(offer, rec as any, wardrobe);
      if (validation.isEligible) {
        const offerDTO = toOfferDTO(offer, rec as any, true, validation.reason, validation.label);
        rec.applicableOffer = offerDTO;
        matchedOffers.push(offerDTO);
        break; // Attach the best applicable offer
      }
    }
  }

  return {
    rankedRecommendations: recommendations,
    matchedOffers,
  };
}

// 12. generate_outfits
export async function generateOutfitsNode(state: AgentStateType) {
  if (!state.customer) return { generatedOutfits: [] };

  const occasion: Occasion = state.intent?.occasion || state.customer.preferredOccasions?.[0] || 'casual';
  const season = state.intent?.season || state.customer.currentSeason || 'all-season';
  const wardrobe = state.wardrobe || [];
  const candidates = (state.rankedRecommendations || []).map((r) => r as any);

  const outfit = generateOutfitLook(
    state.customerId,
    occasion,
    season,
    wardrobe,
    candidates,
    state.intent?.budget
  );

  return {
    generatedOutfits: [outfit],
    processingSteps: ['Building your look'],
  };
}

// 13. generate_explanation
export async function generateExplanationNode(state: AgentStateType) {
  if (!state.customer) return { responseMessage: 'Customer not found' };

  const customer = state.customer;
  const gaps = state.gaps || [];
  const recs = state.rankedRecommendations || [];
  const outfits = state.generatedOutfits || [];

  const llm = getOpenAIClient();

  if (llm && recs.length > 0) {
    try {
      const prompt = `You are WardrobeIQ, a knowledgeable, friendly, concise personal fashion stylist.
Customer Name: ${customer.name}
Customer Preferred Styles: ${customer.preferredStyles.join(', ')}
Top Wardrobe Gap: ${gaps[0]?.label || 'None detected'}
Top Recommended Product: ${recs[0]?.name} (Price: Rs. ${recs[0]?.price}, Category: ${recs[0]?.category})
Why Recommended (Fact): ${recs[0]?.whyThis}
Applicable Offer: ${recs[0]?.applicableOffer ? recs[0].applicableOffer.label : 'None'}
Generated Outfit Occasion: ${outfits[0]?.occasion || 'Everyday'}
User Question: "${state.message}"

CRITICAL RULES:
- ONLY reference the factual products, gaps, prices, and reasons provided above.
- NEVER invent any brand, store, price, product name, or wardrobe piece.
- Respond warmly in 2-3 concise sentences.`;

      const response = await llm.invoke([new HumanMessage(prompt)]);
      const text = typeof response.content === 'string' ? response.content : '';
      return { responseMessage: text };
    } catch {
      // Fallback
    }
  }

  const fallbackText = generateDeterministicStylistResponse(
    customer,
    state.message,
    gaps,
    recs,
    outfits
  );

  return { responseMessage: fallbackText };
}

// 14. finalize_response
export async function finalizeResponseNode(state: AgentStateType) {
  // Persist conversation to ai_conversations collection
  try {
    const collection = getAiConversationsCollection();
    const convId = state.conversationId || `conv_${Date.now()}`;
    const now = new Date().toISOString();

    await collection.updateOne(
      { conversationId: convId },
      {
        $setOnInsert: { customerId: state.customerId, createdAt: now },
        $set: { updatedAt: now },
        $push: {
          messages: {
            $each: [
              { role: 'user', content: state.message, timestamp: now },
              { role: 'assistant', content: state.responseMessage || '', timestamp: now },
            ],
          },
        },
      },
      { upsert: true }
    );
  } catch (err) {
    // Non-blocking log
  }

  return {
    conversationId: state.conversationId || `conv_${Date.now()}`,
  };
}
