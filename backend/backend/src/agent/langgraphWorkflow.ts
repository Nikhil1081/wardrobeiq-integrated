import { HumanMessage } from '@langchain/core/messages';
import { createAgenticStylistGraph } from './agentGraph.js';
import { AIStylistResponseDTO } from '../types/dto.js';
import { getCustomerProfile } from '../tools/customerTools.js';
import { getWardrobeItems, analyzeWardrobe } from '../tools/wardrobeTools.js';
import { detectGaps } from '../tools/gapTools.js';
import { searchCatalogueProducts, toProductCardDTO } from '../tools/catalogueTools.js';
import { scoreProductCandidate } from '../tools/scoringTools.js';
import { getProductOffers, validateOfferConditions, toOfferDTO } from '../tools/offerTools.js';
import { generateOutfitLook } from '../tools/outfitTools.js';
import { getCustomerBrowsingSignals } from '../tools/browsingTools.js';
import { deterministicParseQuery, generateDeterministicStylistResponse } from './fallbackStylist.js';

export function createLangGraphAgent() {
  return createAgenticStylistGraph();
}

/**
 * Executes the genuine Agentic AI loop for WardrobeIQ personal styling.
 * The LLM dynamically decides what tools to call, observes results, and evaluates completion.
 */
export async function runStylistWorkflow(
  customerId: string,
  message: string,
  conversationId?: string,
  onStepProgress?: (stepName: string) => void
): Promise<AIStylistResponseDTO> {
  const convId = conversationId || `conv_${Date.now()}`;
  const app = createAgenticStylistGraph();

  const initialInput = {
    customerId,
    userQuery: message,
    message,
    conversationId: convId,
    iterationCount: 0,
    messages: [new HumanMessage(message)],
    processingSteps: ['Understanding your style request'],
  };

  try {
    let finalState: any = null;

    if (onStepProgress) {
      onStepProgress('Understanding your style request');
      const seenSteps = new Set<string>(['Understanding your style request']);

      // Use stream to report dynamic tool executions in real-time to SSE client
      for await (const chunk of await app.stream(initialInput)) {
        const nodeOutput = Object.values(chunk)[0] as any;
        if (nodeOutput && Array.isArray(nodeOutput.processingSteps)) {
          for (const s of nodeOutput.processingSteps) {
            if (!seenSteps.has(s)) {
              seenSteps.add(s);
              onStepProgress(s);
            }
          }
        }
        finalState = { ...finalState, ...nodeOutput };
      }
    } else {
      finalState = await app.invoke(initialInput);
    }

    const recs = finalState?.rankedRecommendations || finalState?.rankedProducts || [];
    const outfits = finalState?.generatedOutfits || [];
    const gaps = finalState?.wardrobeGaps || finalState?.gaps || [];
    const steps = finalState?.processingSteps && finalState.processingSteps.length > 0
      ? finalState.processingSteps
      : ['Understanding your style request', 'Personalizing styling advice'];

    return {
      message: finalState?.responseMessage || finalState?.finalResponse || 'Here are your curated styling recommendations.',
      recommendations: recs,
      outfits: outfits,
      gaps: gaps,
      conversationId: convId,
      processingSteps: Array.from(new Set(steps)),
    };
  } catch (error) {
    // Dynamic fallback if LLM or agent encounters runtime network/provider limits
    return runDynamicFallbackStylist(customerId, message, convId, onStepProgress);
  }
}

/**
 * Intent-aware dynamic fallback styling engine.
 * Only executes tools relevant to the user query instead of running all tools blindly.
 */
async function runDynamicFallbackStylist(
  customerId: string,
  message: string,
  conversationId: string,
  onStepProgress?: (stepName: string) => void
): Promise<AIStylistResponseDTO> {
  const intent = deterministicParseQuery(message);
  const steps: string[] = ['Understanding your style request'];
  if (onStepProgress) onStepProgress('Understanding your style request');

  const customer = (await getCustomerProfile(customerId)) || (await getCustomerProfile('C001'));
  let wardrobe: any[] = [];
  let gaps: any[] = [];
  let recs: any[] = [];
  let outfits: any[] = [];

  const needsWardrobe = intent.wantsOutfit || !intent.category || intent.occasion || intent.season;
  const isShoppingOnly = intent.category && (intent.budget || intent.color) && !intent.wantsOutfit;

  if (needsWardrobe && !isShoppingOnly) {
    steps.push('Checking your closet');
    if (onStepProgress) onStepProgress('Checking your closet');
    wardrobe = await getWardrobeItems(customerId);
  }

  const isGapQuery = /\b(missing|gap|lacking|need|buy next|boring|improve)\b/i.test(message);
  if (isGapQuery && customer) {
    steps.push('Detecting wardrobe gaps');
    if (onStepProgress) onStepProgress('Detecting wardrobe gaps');
    const analysis = analyzeWardrobe(wardrobe, customer);
    const browsing = await getCustomerBrowsingSignals(customerId);
    gaps = detectGaps(analysis, customer, wardrobe, browsing?.summary);
  }

  const isProductQuery = isShoppingOnly || isGapQuery || /\b(buy|shirt|jacket|shoes|pants|dress|under|price)\b/i.test(message);
  if (isProductQuery && customer) {
    steps.push('Searching catalogue products');
    if (onStepProgress) onStepProgress('Searching catalogue products');
    const candidates = await searchCatalogueProducts({
      category: intent.category,
      occasion: intent.occasion,
      maxPrice: intent.budget,
      color: intent.color,
      limit: 10,
    });

    steps.push('Ranking recommendations');
    if (onStepProgress) onStepProgress('Ranking recommendations');
    const browsing = await getCustomerBrowsingSignals(customerId);
    const scored = candidates.products.map((p) =>
      scoreProductCandidate(p, customer, gaps, wardrobe, browsing?.productWeights?.get(p.productId) || 0)
    );
    scored.sort((a, b) => b.score - a.score);
    recs = scored.slice(0, 6).map((s) => ({
      ...toProductCardDTO(s.product),
      score: s.score,
      scoreBreakdown: s.scoreBreakdown,
      whyThis: s.whyThis,
      compatibleWardrobeItems: s.compatibleWardrobeItems,
      filledGap: s.filledGap,
      applicableOffer: null,
      isSaved: false,
      isInCloset: false,
    }));

    for (const r of recs) {
      const offers = await getProductOffers(r.productId);
      for (const off of offers) {
        const val = validateOfferConditions(off, r as any, wardrobe);
        if (val.isEligible) {
          r.applicableOffer = toOfferDTO(off, r as any, true, val.reason, val.label);
          break;
        }
      }
    }
  }

  if ((intent.wantsOutfit || (!isShoppingOnly && !isGapQuery)) && customer) {
    steps.push('Building your look');
    if (onStepProgress) onStepProgress('Building your look');
    const outfit = generateOutfitLook(
      customerId,
      intent.occasion || customer.preferredOccasions?.[0] || 'casual',
      intent.season || customer.currentSeason || 'all-season',
      wardrobe,
      recs as any,
      intent.budget
    );
    outfits = [outfit];
  }

  const responseText = customer
    ? generateDeterministicStylistResponse(customer, message, gaps, recs, outfits)
    : 'Here are your curated recommendations.';

  return {
    message: responseText,
    recommendations: recs,
    outfits,
    gaps,
    conversationId,
    processingSteps: Array.from(new Set(steps)),
  };
}
