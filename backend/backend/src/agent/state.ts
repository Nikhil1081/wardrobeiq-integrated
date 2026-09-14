import { Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { CustomerDocument, WardrobeDocument, ProductDocument, Category, Occasion, Season } from '../types/domain.js';
import { GapDTO, RecommendationDTO, OutfitDTO, OfferDTO } from '../types/dto.js';
import { WardrobeAnalysis } from '../tools/wardrobeTools.js';

export interface ExtractedQueryIntent {
  category?: Category;
  occasion?: Occasion;
  season?: Season;
  budget?: number;
  style?: string;
  color?: string;
  wantsOutfit?: boolean;
}

export const AgentStateAnnotation = Annotation.Root({
  // Conversation & Messages
  messages: Annotation<BaseMessage[]>({
    reducer: (curr, update) => (Array.isArray(update) ? curr.concat(update) : curr.concat([update])),
    default: () => [],
  }),
  customerId: Annotation<string>(),
  userQuery: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),
  message: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),
  conversationId: Annotation<string>(),

  // Intent & Constraints
  intent: Annotation<ExtractedQueryIntent>({
    reducer: (curr, update) => ({ ...curr, ...update }),
    default: () => ({}),
  }),
  currentConstraints: Annotation<Record<string, any>>({
    reducer: (curr, update) => ({ ...curr, ...update }),
    default: () => ({}),
  }),

  // Domain Caches
  customerProfile: Annotation<CustomerDocument | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  customer: Annotation<CustomerDocument | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  wardrobe: Annotation<WardrobeDocument[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  wardrobeAnalysis: Annotation<WardrobeAnalysis | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  analysis: Annotation<WardrobeAnalysis | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  wardrobeGaps: Annotation<GapDTO[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  gaps: Annotation<GapDTO[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  browsingSignals: Annotation<any>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Catalogue & Scoring Caches
  searchResults: Annotation<ProductDocument[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  candidateProducts: Annotation<ProductDocument[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  filteredProducts: Annotation<ProductDocument[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  rankedProducts: Annotation<RecommendationDTO[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  rankedRecommendations: Annotation<RecommendationDTO[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  offers: Annotation<OfferDTO[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  matchedOffers: Annotation<OfferDTO[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  generatedOutfits: Annotation<OutfitDTO[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),

  // Execution & Agent Loop State
  toolResults: Annotation<Record<string, any>>({
    reducer: (curr, update) => ({ ...curr, ...update }),
    default: () => ({}),
  }),
  clarificationRequired: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),
  clarificationQuestion: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  iterationCount: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 0,
  }),
  processingSteps: Annotation<string[]>({
    reducer: (curr, update) => {
      const merged = curr.concat(update);
      return Array.from(new Set(merged));
    },
    default: () => [],
  }),

  // Responses
  explanationText: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),
  finalResponse: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  responseMessage: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),
});

export type AgentStateType = typeof AgentStateAnnotation.State;
