import { Router } from 'express';
import {
  getCustomersHandler,
  getCustomerByIdHandler,
  updateCustomerHandler,
} from '../controllers/customer.controller.js';
import { getDashboardHandler } from '../controllers/dashboard.controller.js';
import {
  getWardrobeHandler,
  addWardrobeItemHandler,
  updateWardrobeItemHandler,
  deleteWardrobeItemHandler,
} from '../controllers/wardrobe.controller.js';
import { getGapsHandler, getGapDetailHandler } from '../controllers/gap.controller.js';
import { getProductsHandler, getProductByIdHandler } from '../controllers/product.controller.js';
import {
  getRecommendationsHandler,
  getWhyThisHandler,
} from '../controllers/recommendation.controller.js';
import {
  recordBrowsingEventHandler,
  getCustomerBrowsingHandler,
} from '../controllers/browsing.controller.js';
import {
  getProductOffersHandler,
  getCustomerOffersHandler,
  validateOfferHandler,
} from '../controllers/offer.controller.js';
import {
  getSavedItemsHandler,
  saveProductHandler,
  removeSavedProductHandler,
} from '../controllers/saved.controller.js';
import {
  generateOutfitHandler,
  replaceOutfitSlotHandler,
  shuffleOutfitHandler,
  getSavedOutfitsHandler,
  saveOutfitHandler,
  deleteSavedOutfitHandler,
} from '../controllers/outfit.controller.js';
import { recordFeedbackHandler, getCustomerFeedbackHandler } from '../controllers/feedback.controller.js';
import { aiStylistHandler } from '../controllers/ai.controller.js';
import { getExploreHandler } from '../controllers/explore.controller.js';

const router = Router();

// /api/customers
router.get('/customers', getCustomersHandler);
router.get('/customers/:customerId', getCustomerByIdHandler);
router.patch('/customers/:customerId', updateCustomerHandler);

// /api/dashboard/:customerId
router.get('/dashboard/:customerId', getDashboardHandler);

// /api/wardrobe routes
router.get('/wardrobe/customers', getCustomersHandler);
router.get('/wardrobe/customers/:customerId', getCustomerByIdHandler);
router.patch('/wardrobe/customers/:customerId', updateCustomerHandler);
router.get('/wardrobe/dashboard/:customerId', getDashboardHandler);
router.get('/wardrobe/gaps/:customerId', getGapsHandler);
router.get('/wardrobe/gaps/:customerId/:gapId', getGapDetailHandler);
router.post('/wardrobe/recommendations', getRecommendationsHandler);
router.get('/wardrobe/recommendations/:customerId/:productId/explanation', getWhyThisHandler);

router.get('/wardrobe/:customerId', getWardrobeHandler);
router.post('/wardrobe/:customerId', addWardrobeItemHandler);
router.patch('/wardrobe/:customerId/:itemId', updateWardrobeItemHandler);
router.delete('/wardrobe/:customerId/:itemId', deleteWardrobeItemHandler);

// Direct gaps
router.get('/gaps/:customerId', getGapsHandler);
router.get('/gaps/:customerId/:gapId', getGapDetailHandler);

// Direct recommendations
router.post('/recommendations', getRecommendationsHandler);
router.get('/recommendations/:customerId/:productId/explanation', getWhyThisHandler);

// Products
router.get('/products', getProductsHandler);
router.get('/products/:productId', getProductByIdHandler);

// Offers
router.get('/offers/product/:productId', getProductOffersHandler);
router.get('/offers/:customerId', getCustomerOffersHandler);
router.post('/offers/validate', validateOfferHandler);

// Browsing
router.post('/browsing/events', recordBrowsingEventHandler);
router.get('/browsing/:customerId', getCustomerBrowsingHandler);

// Saved items
router.get('/saved/:customerId', getSavedItemsHandler);
router.post('/saved/:customerId/:productId', saveProductHandler);
router.delete('/saved/:customerId/:productId', removeSavedProductHandler);

// Outfits
router.post('/outfits/generate', generateOutfitHandler);
router.post('/outfits/replace', replaceOutfitSlotHandler);
router.post('/outfits/shuffle', shuffleOutfitHandler);

// Saved outfits
router.get('/saved-outfits/:customerId', getSavedOutfitsHandler);
router.post('/saved-outfits/:customerId', saveOutfitHandler);
router.delete('/saved-outfits/:customerId/:outfitId', deleteSavedOutfitHandler);

// Feedback
router.post('/feedback', recordFeedbackHandler);
router.get('/feedback/:customerId', getCustomerFeedbackHandler);

// AI Stylist
router.post('/ai/stylist', aiStylistHandler);

// Explore
router.get('/explore', getExploreHandler);

export default router;
