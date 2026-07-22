export const wardrobeStats = [
  { label: "Total Clothes", value: 87, icon: "Shirt" },
  { label: "Tops", value: 24, icon: "Shirt" },
  { label: "Bottoms", value: 18, icon: "Package" },
  { label: "Dresses", value: 12, icon: "Sparkles" },
  { label: "Shoes", value: 14, icon: "Footprints" },
  { label: "Accessories", value: 19, icon: "Watch" },
];

export const aiTags = [
  "Casual", "Formal", "Party", "Summer", "Winter",
  "Cotton", "Floral", "Black", "White", "Denim", "Linen",
];

export const closetItems = [
  { id: 1, name: "White Cotton Shirt", category: "Top", color: "White", season: "Summer", occasion: "Formal", img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80", fav: true },
  { id: 2, name: "Blue Denim Jeans", category: "Bottom", color: "Blue", season: "All", occasion: "Casual", img: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80", fav: false },
  { id: 3, name: "Black Blazer", category: "Top", color: "Black", season: "Winter", occasion: "Formal", img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80", fav: true },
  { id: 4, name: "Floral Summer Dress", category: "Dress", color: "Pink", season: "Summer", occasion: "Party", img: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80", fav: true },
  { id: 5, name: "White Sneakers", category: "Shoes", color: "White", season: "All", occasion: "Casual", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80", fav: false },
  { id: 6, name: "Beige Trousers", category: "Bottom", color: "Beige", season: "All", occasion: "Formal", img: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80", fav: false },
];

export const outfitFilters = ["Office", "College", "Casual", "Party", "Wedding", "Vacation", "Date Night", "Interview"];
export const weatherFilters = ["Sunny", "Rainy", "Cold"];

export const generatedOutfits = [
  {
    id: 1, name: "Monday Office Look", score: 96,
    top: { name: "White Shirt", img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&q=80" },
    bottom: { name: "Beige Trousers", img: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=200&q=80" },
    shoes: { name: "Brown Loafers", img: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=200&q=80" },
    accessories: { name: "Leather Watch", img: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=200&q=80" },
  },
  {
    id: 2, name: "Weekend Brunch", score: 92,
    top: { name: "Floral Blouse", img: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=200&q=80" },
    bottom: { name: "Blue Jeans", img: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=200&q=80" },
    shoes: { name: "White Sneakers", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80" },
    accessories: { name: "Gold Hoops", img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&q=80" },
  },
  {
    id: 3, name: "Date Night Chic", score: 89,
    top: { name: "Black Blazer", img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&q=80" },
    bottom: { name: "Slim Skirt", img: "https://images.unsplash.com/photo-1583496661160-fb5886a13d44?w=200&q=80" },
    shoes: { name: "Black Heels", img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&q=80" },
    accessories: { name: "Pearl Necklace", img: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&q=80" },
  },
];

export const recommendations = [
  { id: 1, name: "Charcoal Chinos", price: 1499, mrp: 2499, img: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80", reason: "Pairs perfectly with your black jeans" },
  { id: 2, name: "Pastel Knit Sweater", price: 1799, mrp: 2999, img: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80", reason: "Matches 8 outfits in your closet" },
  { id: 3, name: "Classic White Sneakers", price: 2499, mrp: 3999, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80", reason: "Completes your office wardrobe" },
  { id: 4, name: "Emerald Silk Scarf", price: 899, mrp: 1499, img: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&q=80", reason: "Adds color diversity" },
  { id: 5, name: "Wool Overcoat", price: 4999, mrp: 7999, img: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&q=80", reason: "Great for upcoming winter" },
  { id: 6, name: "Leather Belt", price: 999, mrp: 1799, img: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=400&q=80", reason: "Ties together 12 existing outfits" },
];

export const missingEssentials = [
  { id: 1, name: "White Sneakers", reason: "Universal match for 20+ outfits", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" },
  { id: 2, name: "Black Blazer", reason: "Elevates casual & formal looks", img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80" },
  { id: 3, name: "Beige Trousers", reason: "Missing neutral bottom option", img: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80" },
  { id: 4, name: "Classic Watch", reason: "Completes formal appearance", img: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&q=80" },
  { id: 5, name: "White Shirt", reason: "Wardrobe foundation piece", img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80" },
];

export const insights = [
  { label: "Most Worn Color", value: "Blue", sub: "34% of wears" },
  { label: "Favorite Style", value: "Smart Casual", sub: "42 outfits" },
  { label: "Least Used Clothes", value: "12 items", sub: "Not worn in 90 days" },
  { label: "Wardrobe Value", value: "₹84,500", sub: "Est. from 87 items" },
  { label: "Shopping Savings", value: "₹12,300", sub: "Avoided duplicates" },
  { label: "Monthly Outfits", value: 28, sub: "Unique combinations" },
];

export const fashionScore = {
  overall: 89,
  diversity: 92,
  versatility: 85,
  colorBalance: 90,
  minimalDupes: 95,
};

export const timeline = [
  { type: "scan", title: "Scanned Linen Shirt", time: "2h ago", img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200&q=80" },
  { type: "wear", title: "Wore Office Look #12", time: "Today", img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&q=80" },
  { type: "buy", title: "Purchased Wool Coat", time: "Yesterday", img: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=200&q=80" },
  { type: "style", title: "AI styled 5 outfits", time: "2d ago", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&q=80" },
];

export const featuredProduct = {
  name: "Classic White Oxford Shirt",
  category: "Top",
  color: "White",
  price: 2499,
  img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80",
  matches: 12,
  duplicates: 2,
  versatilityBoost: 24,
  compatibility: 94,
  wardrobeMatch: 88,
  costPerWear: "₹42",
  sustainability: "A",
  recommendation: "Highly Recommended",
};
