import { Router } from 'express';
import {
  getCustomerByIdHandler,
  updateCustomerHandler,
  getCustomersHandler,
} from '../../controllers/customer.controller.js';
import {
  getWardrobeHandler,
  addWardrobeItemHandler,
  updateWardrobeItemHandler,
  deleteWardrobeItemHandler,
} from '../../controllers/wardrobe.controller.js';
import { requireAuth, requireAdmin, requireOwnerOrAdmin } from '../../middleware/auth.middleware.js';
import { validateParams, validateBody, validateQuery } from '../../middleware/validate.js';
import {
  CustomerIdParamSchema,
  CustomerUpdateSchema,
  WardrobeAddSchema,
  WardrobeQuerySchema,
} from '../../validation/schemas.js';

const router = Router();

// Only Admin can list all customers/personas
router.get('/', requireAuth, requireAdmin, getCustomersHandler);

// Customer profile operations require ownership or admin privileges
router.get('/:customerId', requireAuth, requireOwnerOrAdmin, validateParams(CustomerIdParamSchema), getCustomerByIdHandler);
router.patch('/:customerId', requireAuth, requireOwnerOrAdmin, validateParams(CustomerIdParamSchema), validateBody(CustomerUpdateSchema), updateCustomerHandler);

// Closet alias under /customers/:customerId/closet
router.use('/:customerId/closet', requireAuth, requireOwnerOrAdmin);
router.get('/:customerId/closet', validateParams(CustomerIdParamSchema), validateQuery(WardrobeQuerySchema), getWardrobeHandler);
router.post('/:customerId/closet', validateParams(CustomerIdParamSchema), validateBody(WardrobeAddSchema), addWardrobeItemHandler);
router.patch('/:customerId/closet/:itemId', updateWardrobeItemHandler);
router.delete('/:customerId/closet/:itemId', deleteWardrobeItemHandler);

export default router;
