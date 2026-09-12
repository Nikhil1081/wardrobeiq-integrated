import { Router } from 'express';
import {
  recordFeedbackHandler,
  getCustomerFeedbackHandler,
} from '../../controllers/feedback.controller.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { FeedbackSchema, CustomerIdParamSchema } from '../../validation/schemas.js';

const router = Router();

router.post('/', validateBody(FeedbackSchema), recordFeedbackHandler);
router.get('/:customerId', validateParams(CustomerIdParamSchema), getCustomerFeedbackHandler);

export default router;
