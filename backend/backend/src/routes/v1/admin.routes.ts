import { Router } from 'express';
import {
  getDatasetAuditHandler,
  postDatasetRepairHandler,
  postValidateImageHandler,
} from '../../controllers/admin.controller.js';

const router = Router();

router.get('/dataset/audit', getDatasetAuditHandler);
router.post('/dataset/repair', postDatasetRepairHandler);
router.post('/dataset/validate-image', postValidateImageHandler);

export default router;
