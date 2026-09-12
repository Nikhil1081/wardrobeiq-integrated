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
import { validateParams, validateBody, validateQuery } from '../../middleware/validate.js';
import {
  CustomerIdParamSchema,
  CustomerUpdateSchema,
  WardrobeAddSchema,
  WardrobeQuerySchema,
} from '../../validation/schemas.js';

const router = Router();

router.get('/', getCustomersHandler);
router.get('/:customerId', validateParams(CustomerIdParamSchema), getCustomerByIdHandler);
router.patch('/:customerId', validateParams(CustomerIdParamSchema), validateBody(CustomerUpdateSchema), updateCustomerHandler);

// Closet alias under /customers/:customerId/closet
router.get('/:customerId/closet', validateParams(CustomerIdParamSchema), validateQuery(WardrobeQuerySchema), getWardrobeHandler);
router.post('/:customerId/closet', validateParams(CustomerIdParamSchema), validateBody(WardrobeAddSchema), addWardrobeItemHandler);
router.patch('/:customerId/closet/:itemId', updateWardrobeItemHandler);
router.delete('/:customerId/closet/:itemId', deleteWardrobeItemHandler);

export default router;
