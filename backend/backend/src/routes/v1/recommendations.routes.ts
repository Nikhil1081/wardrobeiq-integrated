import { Router } from 'express';
import {
  getRecommendationsHandler,
  getWhyThisHandler,
} from '../../controllers/recommendation.controller.js';
import { validateBody } from '../../middleware/validate.js';
import { RecommendationRequestSchema } from '../../validation/schemas.js';

const router = Router();

router.post('/', validateBody(RecommendationRequestSchema), getRecommendationsHandler);
router.get('/:customerId/:productId/explanation', getWhyThisHandler);

export default router;
