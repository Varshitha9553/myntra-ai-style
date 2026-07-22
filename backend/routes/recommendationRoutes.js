import express from 'express';
import { protect } from '../middleware/auth.js';
import { getRecommendations } from '../controllers/recommendationController.js';

const router = express.Router();

router.get('/', protect, getRecommendations);

export default router;
