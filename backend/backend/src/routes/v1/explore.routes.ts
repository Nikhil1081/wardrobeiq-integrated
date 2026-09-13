import { Router } from 'express';
import {
  getExploreHandler,
  getExploreProductsHandler,
  postAddToWardrobeHandler,
  postExploreInteractHandler,
} from '../../controllers/explore.controller.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', getExploreHandler);
router.get('/products', getExploreProductsHandler);
router.post('/add-to-wardrobe', requireAuth, postAddToWardrobeHandler);
router.post('/interact', optionalAuth, postExploreInteractHandler);

export default router;
