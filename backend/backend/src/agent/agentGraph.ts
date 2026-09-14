import { StateGraph, START, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, ToolMessage, BaseMessage, AIMessage } from '@langchain/core/messages';
import { env } from '../config/env.js';
import { AgentStateAnnotation, AgentStateType } from './state.js';
import { wardrobeIQTools } from './agentTools.js';
import { getCustomerProfile } from '../tools/customerTools.js';
import { getWardrobeItems, analyzeWardrobe } from '../tools/wardrobeTools.js';
import { detectGaps } from '../tools/gapTools.js';
import { getCustomerBrowsingSignals } from '../tools/browsingTools.js';
import {
  searchCatalogueProducts,
  getRecommendationCandidates,
  getProductById,
  toProductCardDTO,
} from '../tools/catalogueTools.js';
import { scoreProductCandidate } from '../tools/scoringTools.js';
import { getProductOffers, validateOfferConditions, toOfferDTO } from '../tools/offerTools.js';
import { generateOutfitLook } from '../tools/outfitTools.js';
import { getAiConversationsCollection } from '../db/collections.js';
import { Category, Occasion, Season, CustomerDocument } from '../types/domain.js';
import { RecommendationDTO, GapDTO, OutfitDTO, OfferDTO } from '../types/dto.js';
import { deterministicParseQuery, generateDeterministicStylistResponse } from './fallbackStylist.js';

export const MAX_AGENT_ITERATIONS = 10;

// Helper to initialize LLM client (Groq or OpenAI)
export function getAgentLLM(): ChatOpenAI | null {
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

const SYSTEM_PROMPT = `You are WardrobeIQ, an autonomous AI wardrobe intelligence and personal styling agent.

Your responsibilities:
- Understand the user's fashion request.
- Determine what information is required.
- Autonomously select and execute only the tools you need.
- Analyze the user's wardrobe when necessary.
- Detect wardrobe gaps when relevant.
- Generate personalized outfits.
- Search for products only when necessary.
- Respect customer style preferences, avoided colors, and budget limits.
- Avoid unnecessary tool calls.
- Ask clarifying questions when critical information is missing.
- Formulate concise, friendly, and factual fashion styling advice.

CRITICAL RULES FOR DYNAMIC TOOL CALLING:
1. NEVER follow a static, hardcoded sequence.
2. Only call tools that are genuinely relevant to the user's question:
   - For outfit requests ("What should I wear to college?", "Create a formal outfit"): Call 'get_wardrobe' and 'generate_outfit'. DO NOT automatically detect gaps or search products.
   - For gap / missing item questions ("What clothes am I missing?", "What do I need?"): Call 'get_wardrobe', 'analyze_wardrobe', and 'detect_wardrobe_gaps'. DO NOT search products unless the user asks what to buy.
   - For product search / shopping requests ("Find me a black shirt under 2000"): Call 'search_products' and 'filter_products' / 'rank_products'. DO NOT run wardrobe gap analysis or outfit generation.
   - For wardrobe upgrade questions ("My wardrobe is boring", "What should I buy next?"): Call 'get_wardrobe', 'analyze_wardrobe', 'detect_wardrobe_gaps', and then 'search_products' & 'rank_products'.
   - For seasonal readiness questions ("Do I have enough clothes for winter?"): Call 'get_wardrobe' and 'analyze_wardrobe'.
3. Do NOT repeatedly call the same tool if the data is already available in the conversation.
4. When you have sufficient factual information to answer, stop calling tools and formulate your final response.
5. If critical details are missing (e.g. unknown occasion or empty wardrobe for outfit styling), ask a polite clarifying question.
6. Return only the final recommendation and styling advice. Do not expose internal chain-of-thought.`;

// Map tool names to human-readable progress step labels for frontend SSE streaming
const TOOL_STEP_LABELS: Record<string, string> = {
  get_customer_profile: 'Reviewing customer preferences',
  get_wardrobe: 'Checking your closet',
  analyze_wardrobe: 'Analyzing wardrobe composition',
  detect_wardrobe_gaps: 'Detecting wardrobe gaps',
  search_products: 'Searching catalogue products',
  filter_products: 'Filtering compatible pieces',
  rank_products: 'Ranking recommendations',
  check_offers: 'Checking eligible offers',
  generate_outfit: 'Building your look',
};

// 1. agent_reasoning node
export async function agentReasoningNode(state: AgentStateType) {
  const currentCount = state.iterationCount || 0;
  const newIterationCount = currentCount + 1;

  const llm = getAgentLLM();
  if (!llm) {
    // LLM not configured -> Handled gracefully in self_evaluation
    return {
      iterationCount: newIterationCount,
    };
  }

  const modelWithTools = llm.bindTools(wardrobeIQTools);

  // Build messages sequence
  const messages: BaseMessage[] = [
    new SystemMessage(
      `${SYSTEM_PROMPT}\n\nCurrent User Context:\nCustomer ID: ${state.customerId}\nUser Query: "${state.userQuery || state.message}"`
    ),
    ...(state.messages || []),
  ];

  try {
    const aiMessage = await modelWithTools.invoke(messages);

    const updates: Partial<AgentStateType> = {
      messages: [aiMessage],
      iterationCount: newIterationCount,
    };

    // If no tool calls were made, this is the final or clarifying response
    if (!aiMessage.tool_calls || aiMessage.tool_calls.length === 0) {
      const content = typeof aiMessage.content === 'string' ? aiMessage.content : '';
      updates.finalResponse = content;
      updates.responseMessage = content;

      // Check if LLM asked a clarifying question
      if (content.endsWith('?') || content.toLowerCase().includes('what occasion') || content.toLowerCase().includes('would you like')) {
        updates.clarificationRequired = true;
        updates.clarificationQuestion = content;
      }
    }

    return updates;
  } catch (error: any) {
    // If LLM tool calling errors out, record iteration and let self_evaluation synthesize
    return {
      iterationCount: newIterationCount,
    };
  }
}

// 2. tools_executor node
export async function toolsExecutorNode(state: AgentStateType) {
  const lastMessage = state.messages?.[state.messages.length - 1] as AIMessage | undefined;
  if (!lastMessage || !lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
    return {};
  }

  const toolMessages: ToolMessage[] = [];
  const newSteps: string[] = [];
  const stateUpdates: Partial<AgentStateType> = {};

  for (const toolCall of lastMessage.tool_calls) {
    const { name, args, id } = toolCall;
    const callId = id || `call_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const stepLabel = TOOL_STEP_LABELS[name] || `Executing ${name}`;
    newSteps.push(stepLabel);

    try {
      let resultString = '';

      switch (name) {
        case 'get_customer_profile': {
          const cid = (args as any).customerId || state.customerId;
          const customer = await getCustomerProfile(cid);
          stateUpdates.customerProfile = customer;
          stateUpdates.customer = customer;
          resultString = customer
            ? JSON.stringify({
                customerId: customer.customerId,
                name: customer.name,
                preferredStyles: customer.preferredStyles,
                preferredColors: customer.preferredColors,
                avoidedColors: customer.avoidedColors,
                preferredOccasions: customer.preferredOccasions,
                budget: customer.budget,
              })
            : JSON.stringify({ error: 'Customer not found' });
          break;
        }

        case 'get_wardrobe': {
          const cid = (args as any).customerId || state.customerId;
          const items = await getWardrobeItems(cid, {
            category: (args as any).category,
            occasion: (args as any).occasion,
            season: (args as any).season,
          });
          stateUpdates.wardrobe = items;
          resultString = JSON.stringify({
            totalCount: items.length,
            items: items.slice(0, 15).map((w) => ({
              itemId: w.itemId,
              name: w.name,
              category: w.category,
              subcategory: w.subcategory,
              color: w.color,
              occasion: w.occasion,
              price: w.price,
            })),
          });
          break;
        }

        case 'analyze_wardrobe': {
          const cid = (args as any).customerId || state.customerId;
          let wardrobe = state.wardrobe && state.wardrobe.length > 0 ? state.wardrobe : await getWardrobeItems(cid);
          let customer = state.customerProfile || (await getCustomerProfile(cid));
          stateUpdates.wardrobe = wardrobe;
          stateUpdates.customer = customer;
          stateUpdates.customerProfile = customer;

          const analysis = analyzeWardrobe(wardrobe, customer || undefined);
          stateUpdates.wardrobeAnalysis = analysis;
          stateUpdates.analysis = analysis;
          resultString = JSON.stringify({
            totalItems: analysis.totalItems,
            categoryCounts: analysis.categoryCounts,
            dominantColors: analysis.dominantColors,
            dominantStyles: analysis.dominantStyles,
            colorDiversityScore: analysis.colorDiversity,
            weakestCategory: analysis.weakestCategory,
            topCategory: analysis.topCategory,
          });
          break;
        }

        case 'detect_wardrobe_gaps': {
          const cid = (args as any).customerId || state.customerId;
          let wardrobe = state.wardrobe && state.wardrobe.length > 0 ? state.wardrobe : await getWardrobeItems(cid);
          let customer = state.customerProfile || (await getCustomerProfile(cid));
          let analysis = state.wardrobeAnalysis || analyzeWardrobe(wardrobe, customer || undefined);
          const browsing = await getCustomerBrowsingSignals(cid);

          stateUpdates.wardrobe = wardrobe;
          stateUpdates.customer = customer;
          stateUpdates.customerProfile = customer;
          stateUpdates.wardrobeAnalysis = analysis;
          stateUpdates.analysis = analysis;

          if (!customer) {
            resultString = JSON.stringify({ error: 'Customer profile required for gap analysis' });
          } else {
            const gaps = detectGaps(analysis, customer, wardrobe, browsing?.summary);
            stateUpdates.wardrobeGaps = gaps;
            stateUpdates.gaps = gaps;
            resultString = JSON.stringify({
              gapCount: gaps.length,
              gaps: gaps.map((g) => ({
                gapId: g.gapId,
                category: g.category,
                label: g.label,
                priority: g.priority,
                reason: g.reason,
                supportingSignal: g.supportingSignal,
              })),
            });
          }
          break;
        }

        case 'search_products': {
          const criteria: any = {
            category: (args as any).category,
            occasion: (args as any).occasion,
            maxPrice: (args as any).maxPrice,
            search: (args as any).search,
            color: (args as any).color,
            limit: (args as any).limit || 12,
          };
          const res = await searchCatalogueProducts(criteria);
          stateUpdates.searchResults = res.products;
          stateUpdates.candidateProducts = res.products;
          resultString = JSON.stringify({
            totalMatches: res.total,
            products: res.products.map((p) => ({
              productId: p.productId,
              name: p.name,
              category: p.category,
              price: p.price,
              color: p.color,
              store: p.store,
            })),
          });
          break;
        }

        case 'filter_products': {
          const pids: string[] = (args as any).productIds || [];
          const cid = (args as any).customerId || state.customerId;
          const customer = state.customerProfile || (await getCustomerProfile(cid));
          const wardrobe = state.wardrobe && state.wardrobe.length > 0 ? state.wardrobe : await getWardrobeItems(cid);
          const ownedIds = new Set(wardrobe.map((w) => w.productId).filter(Boolean) as string[]);
          const avoided = (args as any).avoidedColors || customer?.avoidedColors || [];
          const maxPrice = (args as any).maxPrice || customer?.budget;

          const passed: any[] = [];
          for (const pid of pids) {
            const p = (state.searchResults || []).find((x) => x.productId === pid) || (await getProductById(pid));
            if (!p) continue;
            if (ownedIds.has(p.productId)) continue;
            if (avoided.some((c: string) => c.toLowerCase() === p.color.toLowerCase())) continue;
            if (maxPrice && p.price > maxPrice) continue;
            passed.push(p);
          }

          stateUpdates.filteredProducts = passed;
          resultString = JSON.stringify({
            passedCount: passed.length,
            passedProductIds: passed.map((p) => p.productId),
          });
          break;
        }

        case 'rank_products': {
          const cid = (args as any).customerId || state.customerId;
          const pids: string[] = (args as any).productIds || (state.filteredProducts || []).map((p) => p.productId);
          const customer = state.customerProfile || (await getCustomerProfile(cid));
          const wardrobe = state.wardrobe && state.wardrobe.length > 0 ? state.wardrobe : await getWardrobeItems(cid);
          const browsing = await getCustomerBrowsingSignals(cid);
          const gaps = state.wardrobeGaps || state.gaps || [];

          if (!customer) {
            resultString = JSON.stringify({ error: 'Customer not found' });
          } else {
            const productsToRank = [];
            for (const pid of pids) {
              const p = (state.filteredProducts || []).find((x) => x.productId === pid) || (await getProductById(pid));
              if (p) productsToRank.push(p);
            }

            const browsingWeights = browsing?.productWeights || new Map<string, number>();
            const scored = productsToRank.map((prod) => {
              const bScore = browsingWeights.get(prod.productId) || 0;
              return scoreProductCandidate(prod, customer, gaps, wardrobe, bScore);
            });

            scored.sort((a, b) => b.score - a.score);
            const topScored = scored.slice(0, 10);

            const rankedRecs: RecommendationDTO[] = topScored.map((item) => {
              const card = toProductCardDTO(item.product);
              return {
                ...card,
                score: item.score,
                scoreBreakdown: item.scoreBreakdown,
                whyThis: item.whyThis,
                compatibleWardrobeItems: item.compatibleWardrobeItems,
                filledGap: item.filledGap,
                applicableOffer: null,
                isSaved: false,
                isInCloset: false,
              };
            });

            stateUpdates.rankedProducts = rankedRecs;
            stateUpdates.rankedRecommendations = rankedRecs;
            resultString = JSON.stringify({
              rankedCount: rankedRecs.length,
              recommendations: rankedRecs.map((r) => ({
                productId: r.productId,
                name: r.name,
                price: r.price,
                score: r.score,
                whyThis: r.whyThis,
              })),
            });
          }
          break;
        }

        case 'check_offers': {
          const cid = (args as any).customerId || state.customerId;
          const pids: string[] = (args as any).productIds || (state.rankedProducts || []).map((r) => r.productId);
          const wardrobe = state.wardrobe && state.wardrobe.length > 0 ? state.wardrobe : await getWardrobeItems(cid);
          const recs = [...(state.rankedProducts || state.rankedRecommendations || [])];
          const matchedOffers: OfferDTO[] = [];

          for (const pid of pids) {
            const offers = await getProductOffers(pid);
            const rec = recs.find((r) => r.productId === pid);
            const prod = rec || (await getProductById(pid));

            if (!prod || !offers || offers.length === 0) continue;

            for (const off of offers) {
              const val = validateOfferConditions(off, prod as any, wardrobe);
              if (val.isEligible) {
                const offDTO = toOfferDTO(off, prod as any, true, val.reason, val.label);
                matchedOffers.push(offDTO);
                if (rec) rec.applicableOffer = offDTO;
                break;
              }
            }
          }

          stateUpdates.offers = matchedOffers;
          stateUpdates.matchedOffers = matchedOffers;
          stateUpdates.rankedProducts = recs;
          stateUpdates.rankedRecommendations = recs;
          resultString = JSON.stringify({
            matchedOffersCount: matchedOffers.length,
            offers: matchedOffers.map((o) => ({
              offerId: o.offerId,
              label: o.label,
              discountPercentage: o.discountPercentage,
              validUntil: o.validUntil,
            })),
          });
          break;
        }

        case 'generate_outfit': {
          const cid = (args as any).customerId || state.customerId;
          const customer = state.customerProfile || (await getCustomerProfile(cid));
          const wardrobe = state.wardrobe && state.wardrobe.length > 0 ? state.wardrobe : await getWardrobeItems(cid);
          const candidates = (state.rankedProducts || state.searchResults || []).map((r: any) => r as any);

          const occasion: Occasion = (args as any).occasion || customer?.preferredOccasions?.[0] || 'casual';
          const season: Season = (args as any).season || customer?.currentSeason || 'all-season';

          const outfit = generateOutfitLook(
            cid,
            occasion,
            season,
            wardrobe,
            candidates,
            (args as any).maxBudget
          );

          stateUpdates.generatedOutfits = [outfit];
          resultString = JSON.stringify({
            outfitId: outfit.outfitId,
            occasion: outfit.occasion,
            season: outfit.season,
            totalCost: outfit.totalCost,
            itemSlots: outfit.items.map((i) => ({ slot: i.slot, name: i.name, source: i.source, price: i.price })),
          });
          break;
        }

        default:
          resultString = JSON.stringify({ error: `Unknown tool: ${name}` });
      }

      toolMessages.push(
        new ToolMessage({
          tool_call_id: callId,
          name,
          content: resultString,
        })
      );
    } catch (err: any) {
      toolMessages.push(
        new ToolMessage({
          tool_call_id: callId,
          name,
          content: JSON.stringify({ error: err?.message || 'Tool execution error' }),
        })
      );
    }
  }

  return {
    messages: toolMessages,
    processingSteps: newSteps,
    ...stateUpdates,
  };
}

// 3. shouldContinue conditional edge router
export function shouldContinue(state: AgentStateType): 'tools_executor' | 'self_evaluation' {
  const lastMessage = state.messages?.[state.messages.length - 1] as AIMessage | undefined;
  const iterations = state.iterationCount || 0;

  // Stop if max iterations reached
  if (iterations >= MAX_AGENT_ITERATIONS) {
    return 'self_evaluation';
  }

  // Stop if clarification question required
  if (state.clarificationRequired) {
    return 'self_evaluation';
  }

  // Continue to tools if model made tool calls
  if (lastMessage && lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return 'tools_executor';
  }

  return 'self_evaluation';
}

// 4. self_evaluation_and_format node
export async function selfEvaluationNode(state: AgentStateType) {
  let customer = state.customerProfile || state.customer;
  if (!customer) {
    customer = await getCustomerProfile(state.customerId || 'C001');
  }
  if (!customer) {
    customer = await getCustomerProfile('C001');
  }

  const query = state.userQuery || state.message || '';
  const gaps = state.wardrobeGaps || state.gaps || [];
  const recs = state.rankedProducts || state.rankedRecommendations || [];
  const outfits = state.generatedOutfits || [];

  let responseMessage = state.finalResponse || state.responseMessage || '';

  // If responseMessage is empty or unhelpful, synthesize using the evaluation criteria and tool outputs
  if (!responseMessage || responseMessage.trim() === '' || responseMessage.startsWith('{')) {
    const llm = getAgentLLM();
    if (llm && customer) {
      try {
        const topGap = gaps[0]?.label || 'None';
        const topRec = recs[0] ? `${recs[0].name} (₹${recs[0].price}) - ${recs[0].whyThis}` : 'None';
        const outfitSummary = outfits[0] ? `${outfits[0].occasion} look with ${outfits[0].items.length} items` : 'None';

        const evalPrompt = `You are WardrobeIQ personal styling agent.
User Request: "${query}"
Customer: ${customer.name} (Style: ${customer.preferredStyles.join(', ')})
Top Detected Gap: ${topGap}
Top Recommended Product: ${topRec}
Outfit Generated: ${outfitSummary}

Self-Evaluation Guidelines:
- Directly answer the user's specific question.
- Reference factual products, gaps, or outfit pieces found by tools.
- Never invent brands, prices, or clothes.
- Keep response concise, friendly, and empowering (2-3 sentences).`;

        const evalResponse = await llm.invoke([new HumanMessage(evalPrompt)]);
        responseMessage = typeof evalResponse.content === 'string' ? evalResponse.content : '';
      } catch {
        // Deterministic fallback
      }
    }

    if (!responseMessage && customer) {
      responseMessage = generateDeterministicStylistResponse(customer, query, gaps, recs, outfits);
    }
  }

  // Persist conversation to MongoDB
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
              { role: 'user', content: query, timestamp: now },
              { role: 'assistant', content: responseMessage, timestamp: now },
            ],
          },
        },
      },
      { upsert: true }
    );
  } catch {
    // Non-blocking log
  }

  return {
    responseMessage,
    finalResponse: responseMessage,
    rankedRecommendations: recs,
    rankedProducts: recs,
    generatedOutfits: outfits,
    gaps,
    wardrobeGaps: gaps,
  };
}

// Build the LangGraph dynamic agent workflow
export function createAgenticStylistGraph() {
  const workflow = new StateGraph(AgentStateAnnotation)
    .addNode('agent_reasoning', agentReasoningNode)
    .addNode('tools_executor', toolsExecutorNode)
    .addNode('self_evaluation', selfEvaluationNode)
    // Graph routing
    .addEdge(START, 'agent_reasoning')
    .addConditionalEdges('agent_reasoning', shouldContinue, {
      tools_executor: 'tools_executor',
      self_evaluation: 'self_evaluation',
    })
    .addEdge('tools_executor', 'agent_reasoning')
    .addEdge('self_evaluation', END);

  return workflow.compile();
}
