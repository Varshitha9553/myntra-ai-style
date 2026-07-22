class RecommendationEngine {
  async buildRecommendations(user, wardrobeItems) {
    return [
      {
        name: 'Classic White Sneakers',
        price: 2499,
        mrp: 3999,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
        reason: 'Completes your office wardrobe.',
        category: 'Shoes',
      },
      {
        name: 'Pastel Knit Sweater',
        price: 1799,
        mrp: 2999,
        imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80',
        reason: 'Matches 8 outfits in your closet.',
        category: 'Top',
      },
    ];
  }
}

export default new RecommendationEngine();
