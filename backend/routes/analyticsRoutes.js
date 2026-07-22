import express from 'express';
import { protect } from '../middleware/auth.js';
import { getAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/', protect, getAnalytics);

export default router;
