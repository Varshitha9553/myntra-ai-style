import GroqService from '../services/GroqService.js';
import WardrobeService from '../services/WardrobeService.js';

export async function analyzeShopping(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    const wardrobeItems = await WardrobeService.list(userId);
    const analysis = await GroqService.shoppingAssistant({
      selectedProduct: req.body.selectedProduct,
      wardrobeItems,
    });
    res.status(201).json(analysis);
  } catch (error) {
    next(error);
  }
}
