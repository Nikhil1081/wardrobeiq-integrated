import { Router } from 'express';
import {
  getProductOffersHandler,
  getCustomerOffersHandler,
  validateOfferHandler,
} from '../../controllers/offer.controller.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { OfferValidationSchema, CustomerIdParamSchema } from '../../validation/schemas.js';

const router = Router();

router.get('/product/:productId', getProductOffersHandler);
router.get('/:customerId', validateParams(CustomerIdParamSchema), getCustomerOffersHandler);
router.post('/validate', validateBody(OfferValidationSchema), validateOfferHandler);

export default router;
