import { Router } from 'express';
import { aiStylistHandler, aiStylistStreamHandler } from '../../controllers/ai.controller.js';
import { validateBody } from '../../middleware/validate.js';
import { aiRateLimiter } from '../../middleware/security.js';
import { AiStylistRequestSchema } from '../../validation/schemas.js';

const router = Router();

router.post('/stylist', aiRateLimiter(30, 60000), validateBody(AiStylistRequestSchema), aiStylistHandler);
router.post('/stylist/stream', aiRateLimiter(30, 60000), validateBody(AiStylistRequestSchema), aiStylistStreamHandler);

export default router;
