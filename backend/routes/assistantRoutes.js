import express from 'express';
import { protect } from '../middleware/auth.js';
import { askAssistant } from '../controllers/assistantController.js';

const router = express.Router();

router.post('/chat', protect, askAssistant);

export default router;
