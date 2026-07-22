import WishlistService from '../services/WishlistService.js';

export async function getWishlist(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    const items = await WishlistService.list(userId);
    res.json(items);
  } catch (error) {
    next(error);
  }
}

export async function addToWishlist(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    const { productName, productImage, brand, price, myntraUrl } = req.body;
    if (!productName) {
      return res.status(400).json({ message: 'Product name is required' });
    }
    const result = await WishlistService.create(userId, {
      productName,
      productImage,
      brand,
      price,
      myntraUrl,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function removeFromWishlist(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    const { id } = req.params;
    const result = await WishlistService.delete(userId, id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
