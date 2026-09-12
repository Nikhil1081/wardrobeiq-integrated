import { Router } from 'express';
import {
  registerHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  updateProfileHandler,
  resetPasswordHandler,
  demoPersonasHandler,
} from '../../controllers/auth.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', requireAuth, meHandler);
router.patch('/profile', requireAuth, updateProfileHandler);
router.post('/reset-password', resetPasswordHandler);
router.get('/demo-personas', demoPersonasHandler);

export default router;
