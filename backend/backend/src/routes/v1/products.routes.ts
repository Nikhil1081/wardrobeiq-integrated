import { Router } from 'express';
import { getProductsHandler, getProductByIdHandler } from '../../controllers/product.controller.js';
import { validateQuery } from '../../middleware/validate.js';
import { ProductQuerySchema } from '../../validation/schemas.js';

const router = Router();

router.get('/', validateQuery(ProductQuerySchema), getProductsHandler);
router.get('/:productId', getProductByIdHandler);

export default router;
