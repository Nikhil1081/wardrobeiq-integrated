import { Router } from 'express';
import { getDashboardHandler } from '../../controllers/dashboard.controller.js';
import { requireAuth, requireOwnerOrAdmin } from '../../middleware/auth.middleware.js';
import { validateParams } from '../../middleware/validate.js';
import { CustomerIdParamSchema } from '../../validation/schemas.js';

const router = Router();

router.get('/:customerId', requireAuth, requireOwnerOrAdmin, validateParams(CustomerIdParamSchema), getDashboardHandler);

export default router;
