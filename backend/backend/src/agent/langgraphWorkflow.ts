import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentStateAnnotation, AgentStateType } from './state.js';
import {
  understandRequestNode,
  loadCustomerNode,
  loadWardrobeNode,
  analyzeWardrobeNode,
  detectGapsNode,
  loadBrowsingNode,
  parseConstraintsNode,
  searchProductsNode,
  filterProductsNode,
  rankProductsNode,
  checkOffersNode,
  generateOutfitsNode,
  generateExplanationNode,
  finalizeResponseNode,
} from './nodes.js';
import { AIStylistResponseDTO } from '../types/dto.js';

export function createLangGraphAgent() {
  const workflow = new StateGraph(AgentStateAnnotation)
    .addNode('understand_request', understandRequestNode)
    .addNode('load_customer', loadCustomerNode)
    .addNode('load_wardrobe', loadWardrobeNode)
    .addNode('analyze_wardrobe', analyzeWardrobeNode)
    .addNode('detect_gaps', detectGapsNode)
    .addNode('load_browsing', loadBrowsingNode)
    .addNode('parse_constraints', parseConstraintsNode)
    .addNode('search_products', searchProductsNode)
    .addNode('filter_products', filterProductsNode)
    .addNode('rank_products', rankProductsNode)
    .addNode('check_offers', checkOffersNode)
    .addNode('generate_outfits', generateOutfitsNode)
    .addNode('generate_explanation', generateExplanationNode)
    .addNode('finalize_response', finalizeResponseNode)
    // Edges
    .addEdge(START, 'understand_request')
    .addEdge('understand_request', 'load_customer')
    .addEdge('load_customer', 'load_wardrobe')
    .addEdge('load_wardrobe', 'analyze_wardrobe')
    .addEdge('analyze_wardrobe', 'detect_gaps')
    .addEdge('detect_gaps', 'load_browsing')
    .addEdge('load_browsing', 'parse_constraints')
    .addEdge('parse_constraints', 'search_products')
    .addEdge('search_products', 'filter_products')
    .addEdge('filter_products', 'rank_products')
    .addEdge('rank_products', 'check_offers')
    .addEdge('check_offers', 'generate_outfits')
    .addEdge('generate_outfits', 'generate_explanation')
    .addEdge('generate_explanation', 'finalize_response')
    .addEdge('finalize_response', END);

  return workflow.compile();
}

export async function runStylistWorkflow(
  customerId: string,
  message: string,
  conversationId?: string,
  onStepProgress?: (stepName: string) => void
): Promise<AIStylistResponseDTO> {
  const app = createLangGraphAgent();

  const convId = conversationId || `conv_${Date.now()}`;
  const initialInput = {
    customerId,
    message,
    conversationId: convId,
    processingSteps: [],
  };

  const finalState = await app.invoke(initialInput);

  // Return clean high-level processing steps without duplicates
  const highLevelSteps = [
    'Understanding request',
    'Checking your closet',
    'Detecting wardrobe gaps',
    'Finding compatible pieces',
    'Ranking recommendations',
    'Building your look',
  ];

  return {
    message: finalState.responseMessage || 'Here are your curated recommendations.',
    recommendations: finalState.rankedRecommendations || [],
    outfits: finalState.generatedOutfits || [],
    gaps: finalState.gaps || [],
    conversationId: convId,
    processingSteps: highLevelSteps,
  };
}
