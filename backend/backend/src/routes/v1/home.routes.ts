import { Router } from 'express';
import { getDashboardHandler } from '../../controllers/dashboard.controller.js';
import { validateParams } from '../../middleware/validate.js';
import { CustomerIdParamSchema } from '../../validation/schemas.js';

const router = Router();

router.get('/:customerId', validateParams(CustomerIdParamSchema), getDashboardHandler);

export default router;
