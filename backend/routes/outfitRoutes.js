import express from 'express';
import { protect } from '../middleware/auth.js';
import { generateOutfit, listGeneratedOutfits, getCombinations, reviseOutfit, wearOutfit } from '../controllers/outfitController.js';

const router = express.Router();

router.get('/', protect, listGeneratedOutfits);
router.get('/combinations', protect, getCombinations);
router.post('/generate', protect, generateOutfit);
router.post('/revise', protect, reviseOutfit);
router.post('/wear', protect, wearOutfit);

export default router;
