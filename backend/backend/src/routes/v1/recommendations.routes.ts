import { Router } from 'express';
import {
  getRecommendationsHandler,
  getWhyThisHandler,
} from '../../controllers/recommendation.controller.js';
import { requireAuth, requireOwnerOrAdmin } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.js';
import { RecommendationRequestSchema } from '../../validation/schemas.js';

const router = Router();

router.use(requireAuth, requireOwnerOrAdmin);
router.post('/', validateBody(RecommendationRequestSchema), getRecommendationsHandler);
router.get('/:customerId/:productId/explanation', getWhyThisHandler);

export default router;
