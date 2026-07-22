import express from 'express';
import { protect } from '../middleware/auth.js';
import { analyzeShopping } from '../controllers/shoppingController.js';

const router = express.Router();

router.post('/analyze', protect, analyzeShopping);

export default router;
