import { Annotation } from '@langchain/langgraph';
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
  customerId: Annotation<string>(),
  message: Annotation<string>(),
  conversationId: Annotation<string>(),
  intent: Annotation<ExtractedQueryIntent>(),
  customer: Annotation<CustomerDocument | null>(),
  wardrobe: Annotation<WardrobeDocument[]>(),
  analysis: Annotation<WardrobeAnalysis | null>(),
  gaps: Annotation<GapDTO[]>(),
  browsingSignals: Annotation<any>(),
  candidateProducts: Annotation<ProductDocument[]>(),
  filteredProducts: Annotation<ProductDocument[]>(),
  rankedRecommendations: Annotation<RecommendationDTO[]>(),
  matchedOffers: Annotation<OfferDTO[]>(),
  generatedOutfits: Annotation<OutfitDTO[]>(),
  explanationText: Annotation<string>(),
  processingSteps: Annotation<string[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),
  responseMessage: Annotation<string>(),
});

export type AgentStateType = typeof AgentStateAnnotation.State;
