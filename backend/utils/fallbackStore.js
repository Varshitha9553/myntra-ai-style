const fallbackUsers = [];
const fallbackWardrobeItems = [
  { _id: 'item-1', user: 'demo', name: 'White Cotton Shirt', category: 'Top', color: 'White', season: 'Summer', occasion: 'Formal', imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80', favorite: true, aiTags: ['Casual', 'Formal'] },
  { _id: 'item-2', user: 'demo', name: 'Blue Denim Jeans', category: 'Bottom', color: 'Blue', season: 'All', occasion: 'Casual', imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80', favorite: false, aiTags: ['Casual'] },
  { _id: 'item-3', user: 'demo', name: 'Black Blazer', category: 'Top', color: 'Black', season: 'Winter', occasion: 'Formal', imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80', favorite: true, aiTags: ['Formal', 'Winter'] },
];

const fallbackRecommendations = [
  { _id: 'rec-1', user: 'demo', name: 'Charcoal Chinos', price: 1499, mrp: 2499, imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80', reason: 'Pairs perfectly with your existing wardrobe.', category: 'Bottom' },
  { _id: 'rec-2', user: 'demo', name: 'Pastel Knit Sweater', price: 1799, mrp: 2999, imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80', reason: 'Adds versatility to your closet.', category: 'Top' },
];

const fallbackOutfits = [];
const fallbackAnalyses = [];
const fallbackPreferences = { style: 'smart casual', colors: ['black', 'white', 'blue'], budget: 5000, weather: 'all' };

export { fallbackUsers, fallbackWardrobeItems, fallbackRecommendations, fallbackOutfits, fallbackAnalyses, fallbackPreferences };
