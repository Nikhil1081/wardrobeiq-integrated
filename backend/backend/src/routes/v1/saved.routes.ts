import { Router } from 'express';
import {
  getSavedItemsHandler,
  saveProductHandler,
  removeSavedProductHandler,
} from '../../controllers/saved.controller.js';
import { requireAuth, requireOwnerOrAdmin } from '../../middleware/auth.middleware.js';
import { validateParams } from '../../middleware/validate.js';
import { CustomerIdParamSchema } from '../../validation/schemas.js';

const router = Router();

router.use(requireAuth, requireOwnerOrAdmin);
router.get('/:customerId', validateParams(CustomerIdParamSchema), getSavedItemsHandler);
router.post('/:customerId/:productId', saveProductHandler);
router.delete('/:customerId/:productId', removeSavedProductHandler);

// Aliases for /saved with body or query parameters
router.post('/', saveProductHandler);
router.delete('/:productId', removeSavedProductHandler);

export default router;
