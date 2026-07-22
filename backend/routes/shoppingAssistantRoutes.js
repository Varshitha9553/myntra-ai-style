import express from 'express';
import { protect } from '../middleware/auth.js';
import { analyzeShoppingProduct } from '../controllers/shoppingAssistantController.js';

const router = express.Router();

router.post('/analyze', protect, analyzeShoppingProduct);

export default router;
