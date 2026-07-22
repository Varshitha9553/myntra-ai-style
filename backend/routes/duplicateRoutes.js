import express from 'express';
import { protect } from '../middleware/auth.js';
import { checkDuplicates } from '../controllers/duplicateController.js';

const router = express.Router();

router.post('/check', protect, checkDuplicates);
router.post('/', protect, checkDuplicates);

export default router;
