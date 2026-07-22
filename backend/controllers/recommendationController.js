import RecommendationService from '../services/RecommendationService.js';
import GroqService from '../services/GroqService.js';
import WardrobeService from '../services/WardrobeService.js';

function analyzeWardrobeStats(wardrobeItems) {
  const colors = {};
  const categories = {};
  const occasions = {};

  for (const item of wardrobeItems) {
    const col = item.color || 'Unknown';
    colors[col] = (colors[col] || 0) + 1;

    const cat = item.category || 'Unknown';
    categories[cat] = (categories[cat] || 0) + 1;

    const occ = item.occasion || 'Casual';
    occasions[occ] = (occasions[occ] || 0) + 1;
  }

  // Find most frequent color
  let favoriteColor = 'Neutral';
  let maxColCount = 0;
  for (const [col, count] of Object.entries(colors)) {
    if (count > maxColCount) {
      maxColCount = count;
      favoriteColor = col;
    }
  }

  // Find most frequent category
  let favoriteCategory = 'Topwear';
  let maxCatCount = 0;
  for (const [cat, count] of Object.entries(categories)) {
    if (count > maxCatCount) {
      maxCatCount = count;
      favoriteCategory = cat;
    }
  }

  // Find most frequent occasion
  let primaryStyle = 'Casual';
  let maxOccCount = 0;
  for (const [occ, count] of Object.entries(occasions)) {
    if (count > maxOccCount) {
      maxOccCount = count;
      primaryStyle = occ === 'Office' ? 'Smart Casual' : occ;
    }
  }

  // Wardrobe Gap detection
  const gaps = [];
  if (!categories['Footwear']) gaps.push('Black Sneakers');
  if (!categories['Outerwear']) gaps.push('Neutral Blazer');
  if (!categories['Accessories']) gaps.push('Analog Watch');
  
  const hasWhiteTop = wardrobeItems.some(it => String(it.category).toLowerCase() === 'topwear' && String(it.color).toLowerCase().includes('white'));
  if (!hasWhiteTop) gaps.push('White Formal Shirt');

  const hasBlueBottom = wardrobeItems.some(it => String(it.category).toLowerCase() === 'bottomwear' && String(it.color).toLowerCase().includes('blue'));
  if (!hasBlueBottom) gaps.push('Blue Denim Jeans');

  if (gaps.length === 0) {
    gaps.push('Black Trousers', 'Casual Jacket');
  }

  return {
    styleProfile: { primaryStyle, favoriteColor, favoriteCategory },
    wardrobeGaps: gaps.slice(0, 3)
  };
}

function getRecommendationTypeForIndex(i) {
  const types = [
    "Because It Matches Your Wardrobe",
    "Complete Your Collection",
    "Trending For Your Style",
    "Everyday Essentials"
  ];
  return types[i % types.length];
}

export async function getRecommendations(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    const wardrobeItems = await WardrobeService.list(userId);
    const savedRecommendations = await RecommendationService.list(userId);

    const stats = analyzeWardrobeStats(wardrobeItems);

    if (savedRecommendations.length > 0) {
      return res.json({
        styleProfile: stats.styleProfile,
        wardrobeGaps: stats.wardrobeGaps,
        recommendations: savedRecommendations.map((r, i) => ({
          name: r.name,
          category: r.category,
          price: r.price,
          mrp: r.mrp,
          imageUrl: r.imageUrl,
          compatibilityScore: 78 + (i * 7) % 20,
          reason: r.reason,
          recommendationType: getRecommendationTypeForIndex(i)
        }))
      });
    }

    const aiResponse = await GroqService.recommendProducts({ wardrobeItems });
    
    // Save AI recommendations to DB for future caching
    if (aiResponse && Array.isArray(aiResponse.recommendations)) {
      for (const rec of aiResponse.recommendations) {
        await RecommendationService.create(userId, {
          name: rec.name,
          category: rec.category,
          price: rec.price,
          mrp: rec.mrp,
          imageUrl: rec.imageUrl,
          reason: rec.reason
        });
      }
      return res.json(aiResponse);
    }

    res.json({
      styleProfile: stats.styleProfile,
      wardrobeGaps: stats.wardrobeGaps,
      recommendations: []
    });
  } catch (error) {
    next(error);
  }
}
