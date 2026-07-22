import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { createWardrobe, deleteWardrobe, getWardrobeById, listWardrobe, updateWardrobe, createWardrobeDirect } from '../controllers/wardrobeController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', protect, listWardrobe);
router.get('/:id', protect, getWardrobeById);
router.post('/', protect, upload.single('image'), createWardrobe);
router.post('/upload', protect, upload.single('image'), createWardrobe);
router.post('/direct', protect, createWardrobeDirect);
router.put('/:id', protect, updateWardrobe);
router.delete('/:id', protect, deleteWardrobe);

export default router;
