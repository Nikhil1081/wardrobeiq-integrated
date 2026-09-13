import { Router } from 'express';
import {
  getWardrobeHandler,
  addWardrobeItemHandler,
  updateWardrobeItemHandler,
  deleteWardrobeItemHandler,
} from '../../controllers/wardrobe.controller.js';
import { requireAuth, requireOwnerOrAdmin } from '../../middleware/auth.middleware.js';
import { validateParams, validateBody, validateQuery } from '../../middleware/validate.js';
import {
  CustomerIdParamSchema,
  WardrobeAddSchema,
  WardrobeUpdateSchema,
  WardrobeQuerySchema,
} from '../../validation/schemas.js';

const router = Router();

// Enforce strict user isolation: User can only view/modify their own wardrobe, admin can access all
router.use('/:customerId', requireAuth, requireOwnerOrAdmin);

router.get('/:customerId', validateParams(CustomerIdParamSchema), validateQuery(WardrobeQuerySchema), getWardrobeHandler);
router.post('/:customerId', validateParams(CustomerIdParamSchema), validateBody(WardrobeAddSchema), addWardrobeItemHandler);
router.patch('/:customerId/:itemId', updateWardrobeItemHandler);
router.delete('/:customerId/:itemId', deleteWardrobeItemHandler);

export default router;
