import express from 'express';
import { getProfile, getInsights, getAnalytics } from '../controllers/personalizationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.get('/insights', protect, getInsights);
router.get('/analytics', protect, getAnalytics);

export default router;
