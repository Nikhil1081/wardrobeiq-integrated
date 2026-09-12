import { Collection } from 'mongodb';
import { getDB } from './mongo.js';
import {
  ProductDocument,
  CustomerDocument,
  UserDocument,
  WardrobeDocument,
  BrowsingHistoryDocument,
  OfferDocument,
  SavedItemDocument,
  SavedOutfitDocument,
  FeedbackDocument,
  OutfitHistoryDocument,
  AiConversationDocument,
} from '../types/domain.js';

export function getUsersCollection(): Collection<UserDocument> {
  return getDB().collection<UserDocument>('users');
}

export function getProductsCollection(): Collection<ProductDocument> {
  return getDB().collection<ProductDocument>('products');
}

export function getCustomersCollection(): Collection<CustomerDocument> {
  return getDB().collection<CustomerDocument>('customers');
}

export function getWardrobesCollection(): Collection<WardrobeDocument> {
  return getDB().collection<WardrobeDocument>('wardrobes');
}

export function getBrowsingHistoryCollection(): Collection<BrowsingHistoryDocument> {
  return getDB().collection<BrowsingHistoryDocument>('browsing_history');
}

export function getOffersCollection(): Collection<OfferDocument> {
  return getDB().collection<OfferDocument>('offers');
}

export function getSavedItemsCollection(): Collection<SavedItemDocument> {
  return getDB().collection<SavedItemDocument>('saved_items');
}

export function getSavedOutfitsCollection(): Collection<SavedOutfitDocument> {
  return getDB().collection<SavedOutfitDocument>('saved_outfits');
}

export function getFeedbackCollection(): Collection<FeedbackDocument> {
  return getDB().collection<FeedbackDocument>('feedback');
}

export function getOutfitHistoryCollection(): Collection<OutfitHistoryDocument> {
  return getDB().collection<OutfitHistoryDocument>('outfit_history');
}

export function getAiConversationsCollection(): Collection<AiConversationDocument> {
  return getDB().collection<AiConversationDocument>('ai_conversations');
}
