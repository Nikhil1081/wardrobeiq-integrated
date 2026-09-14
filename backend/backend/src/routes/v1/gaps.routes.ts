import { Router } from 'express';
import { getGapsHandler, getGapDetailHandler } from '../../controllers/gap.controller.js';
import { requireAuth, requireOwnerOrAdmin } from '../../middleware/auth.middleware.js';
import { validateParams } from '../../middleware/validate.js';
import { CustomerIdParamSchema } from '../../validation/schemas.js';

const router = Router();

router.use('/:customerId', requireAuth, requireOwnerOrAdmin);
router.get('/:customerId', validateParams(CustomerIdParamSchema), getGapsHandler);
router.get('/:customerId/:gapId', getGapDetailHandler);

export default router;
