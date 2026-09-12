import { Router } from 'express';
import { getExploreHandler } from '../../controllers/explore.controller.js';

const router = Router();

router.get('/', getExploreHandler);

export default router;
