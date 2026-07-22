import express from 'express';
import { protect } from '../middleware/auth.js';
import { getPreferences, updatePreferences } from '../controllers/preferenceController.js';

const router = express.Router();

router.get('/', protect, getPreferences);
router.put('/', protect, updatePreferences);

export default router;
