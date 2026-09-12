import { Router } from 'express';
import {
  getWardrobeHandler,
  addWardrobeItemHandler,
  updateWardrobeItemHandler,
  deleteWardrobeItemHandler,
} from '../../controllers/wardrobe.controller.js';
import { validateParams, validateBody, validateQuery } from '../../middleware/validate.js';
import {
  CustomerIdParamSchema,
  WardrobeAddSchema,
  WardrobeUpdateSchema,
  WardrobeQuerySchema,
} from '../../validation/schemas.js';

const router = Router();

router.get('/:customerId', validateParams(CustomerIdParamSchema), validateQuery(WardrobeQuerySchema), getWardrobeHandler);
router.post('/:customerId', validateParams(CustomerIdParamSchema), validateBody(WardrobeAddSchema), addWardrobeItemHandler);
router.patch('/:customerId/:itemId', updateWardrobeItemHandler);
router.delete('/:customerId/:itemId', deleteWardrobeItemHandler);

export default router;
