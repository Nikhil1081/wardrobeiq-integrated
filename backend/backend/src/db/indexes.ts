import {
  getProductsCollection,
  getCustomersCollection,
  getWardrobesCollection,
  getBrowsingHistoryCollection,
  getOffersCollection,
  getSavedItemsCollection,
  getSavedOutfitsCollection,
  getFeedbackCollection,
  getOutfitHistoryCollection,
  getAiConversationsCollection,
} from './collections.js';
import { logger } from '../utils/logger.js';

export async function createIndexes(): Promise<void> {
  try {
    logger.info('Creating MongoDB indexes...');

    const products = getProductsCollection();
    await products.createIndex({ productId: 1 }, { unique: true });
    await products.createIndex({ category: 1, price: 1 });
    await products.createIndex({ color: 1 });
    await products.createIndex({ price: 1 });
    await products.createIndex({ styleTags: 1 });
    await products.createIndex({ occasion: 1 });
    await products.createIndex({ season: 1 });
    await products.createIndex({ store: 1 });
    await products.createIndex({ available: 1 });

    const customers = getCustomersCollection();
    await customers.createIndex({ customerId: 1 }, { unique: true });

    const wardrobes = getWardrobesCollection();
    await wardrobes.createIndex({ customerId: 1 });
    await wardrobes.createIndex({ productId: 1 });
    await wardrobes.createIndex({ customerId: 1, category: 1 });
    await wardrobes.createIndex({ itemId: 1 }, { unique: true });

    const browsing = getBrowsingHistoryCollection();
    await browsing.createIndex({ customerId: 1 });
    await browsing.createIndex({ productId: 1 });
    await browsing.createIndex({ timestamp: -1 });
    await browsing.createIndex({ customerId: 1, timestamp: -1 });

    const offers = getOffersCollection();
    await offers.createIndex({ offerId: 1 }, { unique: true });
    await offers.createIndex({ productId: 1 });
    await offers.createIndex({ validUntil: 1 });
    await offers.createIndex({ active: 1 });
    await offers.createIndex({ productId: 1, active: 1, validUntil: 1 });

    const savedItems = getSavedItemsCollection();
    await savedItems.createIndex({ customerId: 1, productId: 1 }, { unique: true });
    await savedItems.createIndex({ customerId: 1 });

    const savedOutfits = getSavedOutfitsCollection();
    await savedOutfits.createIndex({ customerId: 1 });
    await savedOutfits.createIndex({ outfitId: 1 }, { unique: true });

    const feedback = getFeedbackCollection();
    await feedback.createIndex({ customerId: 1, productId: 1 }, { unique: true });

    const outfitHistory = getOutfitHistoryCollection();
    await outfitHistory.createIndex({ customerId: 1, createdAt: -1 });

    const aiConversations = getAiConversationsCollection();
    await aiConversations.createIndex({ conversationId: 1 }, { unique: true });
    await aiConversations.createIndex({ customerId: 1 });

    logger.info('All MongoDB indexes successfully initialized.');
  } catch (error) {
    logger.error('Error creating MongoDB indexes', error);
    throw error;
  }
}
