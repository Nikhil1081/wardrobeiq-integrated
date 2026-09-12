import { Router } from 'express';
import homeRoutes from './home.routes.js';
import closetRoutes from './closet.routes.js';
import gapsRoutes from './gaps.routes.js';
import recommendationsRoutes from './recommendations.routes.js';
import outfitsRoutes from './outfits.routes.js';
import aiRoutes from './ai.routes.js';
import exploreRoutes from './explore.routes.js';
import savedRoutes from './saved.routes.js';
import profileRoutes from './profile.routes.js';
import browsingRoutes from './browsing.routes.js';
import feedbackRoutes from './feedback.routes.js';
import offersRoutes from './offers.routes.js';
import productsRoutes from './products.routes.js';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

router.use('/home', homeRoutes);
router.use('/closet', closetRoutes);
router.use('/gaps', gapsRoutes);
router.use('/recommendations', recommendationsRoutes);
router.use('/outfits', outfitsRoutes);
router.use('/ai', aiRoutes);
router.use('/explore', exploreRoutes);
router.use('/saved', savedRoutes);
router.use('/profile', profileRoutes);
router.use('/customers', profileRoutes);
router.use('/browsing', browsingRoutes);
router.use('/browsing-events', browsingRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/offers', offersRoutes);
router.use('/products', productsRoutes);

export default router;
