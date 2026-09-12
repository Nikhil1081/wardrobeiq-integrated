import { Router } from 'express';
import {
  recordBrowsingEventHandler,
  getCustomerBrowsingHandler,
} from '../../controllers/browsing.controller.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { BrowsingEventSchema, CustomerIdParamSchema } from '../../validation/schemas.js';

const router = Router();

router.post('/events', validateBody(BrowsingEventSchema), recordBrowsingEventHandler);
router.get('/:customerId', validateParams(CustomerIdParamSchema), getCustomerBrowsingHandler);

export default router;
