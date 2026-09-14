import { Router } from 'express';
import {
  getDatasetAuditHandler,
  postDatasetRepairHandler,
  postValidateImageHandler,
  getAdminDashboardHandler,
  getAdminClothingHandler,
  getAdminPurchasesHandler,
  getAdminBrowsingHandler,
  getAdminPersonasHandler,
  getAdminUsersHandler,
} from '../../controllers/admin.controller.js';
import { requireAuth, requireAdmin, optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// Protected Admin Control Center & Quality Management (Requires Admin Privileges)
router.use(requireAuth, requireAdmin);

router.get('/dataset/audit', getDatasetAuditHandler);
router.post('/dataset/validate-image', postValidateImageHandler);
router.post('/dataset/repair', postDatasetRepairHandler);
router.get('/dashboard', getAdminDashboardHandler);
router.get('/clothing', getAdminClothingHandler);
router.get('/purchases', getAdminPurchasesHandler);
router.get('/browsing', getAdminBrowsingHandler);
router.get('/personas', getAdminPersonasHandler);
router.get('/users', getAdminUsersHandler);

export default router;
