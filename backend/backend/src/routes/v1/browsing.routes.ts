import { Router } from 'express';
import {
  recordBrowsingEventHandler,
  getCustomerBrowsingHandler,
} from '../../controllers/browsing.controller.js';
import { requireAuth, requireOwnerOrAdmin } from '../../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { BrowsingEventSchema, CustomerIdParamSchema } from '../../validation/schemas.js';

const router = Router();

router.use(requireAuth, requireOwnerOrAdmin);

router.post('/events', validateBody(BrowsingEventSchema), recordBrowsingEventHandler);
router.get('/:customerId', validateParams(CustomerIdParamSchema), getCustomerBrowsingHandler);

export default router;
