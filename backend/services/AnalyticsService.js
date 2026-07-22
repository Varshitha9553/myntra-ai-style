import WardrobeService from './WardrobeService.js';
import OutfitService from './OutfitService.js';
import RecommendationService from './RecommendationService.js';
import DuplicateDetectionService from './DuplicateDetectionService.js';
import GroqService from './GroqService.js';
import { createConnection } from '../config/oracle.js';

const normalizeText = (value = '') => String(value || '').trim().toLowerCase();
const extractWords = (value = '') => normalizeText(value).split(/[^a-z0-9]+/g).filter(Boolean);

function mode(items = []) {
  const counts = items.reduce((acc, value) => {
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : null;
}

function formatTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Today';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const essentials = [
  { name: 'White Shirt', category: 'Top', reason: 'Wardrobe foundation piece', imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80' },
  { name: 'Black Blazer', category: 'Top', reason: 'Elevates formal and smart casual looks', imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80' },
  { name: 'Beige Trousers', category: 'Bottom', reason: 'Adds a neutral base for many outfits', imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80' },
  { name: 'White Sneakers', category: 'Shoes', reason: 'Matches casual and smart looks', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80' },
  { name: 'Leather Belt', category: 'Accessory', reason: 'Completes belts and pants looks', imageUrl: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=400&q=80' },
];

function buildMissingEssentials(items) {
  const presentCategories = new Set(items.map((item) => normalizeText(item.category)));
  return essentials.filter((essential) => {
    const matchesItem = items.some((item) => {
      const name = normalizeText(item.name);
      return name.includes(normalizeText(essential.name)) || normalizeText(item.category) === normalizeText(essential.category);
    });
    return !matchesItem;
  });
}

function computeFashionScore(items, duplicateScore) {
  const categories = new Set(items.map((item) => normalizeText(item.category)).filter(Boolean));
  const colors = new Set(items.map((item) => normalizeText(item.color)).filter(Boolean));
  const seasons = new Set(items.map((item) => normalizeText(item.season)).filter(Boolean));
  const diversity = Math.min(100, Math.round((categories.size / 6) * 100) || 30);
  const versatility = Math.min(100, Math.round((seasons.size / 4) * 100) || 40);
  const colorBalance = Math.min(100, Math.round((colors.size / 8) * 100) || 35);
  const minimalDupes = Math.max(0, Math.min(100, 100 - duplicateScore));
  const overall = Math.round((diversity + versatility + colorBalance + minimalDupes) / 4);
  return { overall, diversity, versatility, colorBalance, minimalDupes };
}

function summarizeWardrobe(items) {
  const colors = items.map((item) => normalizeText(item.color)).filter(Boolean);
  const categories = items.map((item) => normalizeText(item.category)).filter(Boolean);
  const mostUsedColor = mode(colors) || 'Neutral';
  const favoriteStyle = mode(categories) || 'Smart Casual';
  const wardrobeValue = items.length * 650;
  return { mostUsedColor, favoriteStyle, wardrobeValue };
}

function buildTimeline(items, outfits, recommendations, wears = []) {
  const events = [];
  
  wears.forEach((wear) => {
    const firstItem = items.find(it => wear.itemIds.includes(Number(it.id)));
    events.push({
      type: 'wear',
      title: `Wore Outfit for ${wear.occasion} (${wear.weather})`,
      time: formatTime(wear.wornAt),
      img: firstItem?.imageUrl || ''
    });
  });

  items.slice(0, 3).forEach((item) => {
    events.push({ type: 'scan', title: `Scanned ${item.name || item.category}`, time: formatTime(item.createdAt), img: item.imageUrl });
  });
  outfits.slice(0, 2).forEach((outfit) => {
    events.push({ type: 'style', title: `Styled ${outfit.name}`, time: formatTime(outfit.createdAt), img: outfit.items?.[0]?.imageUrl || outfit.items?.[0]?.img || '' });
  });
  recommendations.slice(0, 1).forEach((rec) => {
    events.push({ type: 'buy', title: `Recommended ${rec.name}`, time: formatTime(rec.createdAt), img: rec.imageUrl });
  });
  return events.length ? events : [{ type: 'scan', title: 'No wardrobe activity yet', time: 'Today', img: '' }];
}

class AnalyticsService {
  async getDashboard(userId) {
    const wardrobeItems = await WardrobeService.list(userId);
    const outfits = await OutfitService.list(userId);
    const recommendations = await RecommendationService.list(userId);
    const duplicateProduct = wardrobeItems[0] || { name: '', category: '', color: '', brand: '' };
    const duplicateAnalysis = await DuplicateDetectionService.detectDuplicates(userId, { selectedProduct: duplicateProduct });

    const connection = await createConnection();
    let wears = [];
    try {
      const result = await connection.execute(
        `SELECT history_id, item_ids, occasion, weather, worn_at FROM wear_history WHERE user_id = :userId ORDER BY worn_at DESC FETCH FIRST 5 ROWS ONLY`,
        { userId }
      );
      wears = result.rows.map(row => {
        const itemIdsStr = row.ITEM_IDS ?? row.item_ids;
        const ids = String(itemIdsStr || '').split(',').map(Number);
        return {
          id: row.HISTORY_ID ?? row.history_id,
          itemIds: ids,
          occasion: row.OCCASION ?? row.occasion,
          weather: row.WEATHER ?? row.weather,
          wornAt: row.WORN_AT ?? row.worn_at,
        };
      });
    } catch (e) {
      console.warn('[Analytics Service] Could not fetch wear history:', e.message);
    } finally {
      await connection.close();
    }

    const featuredProduct = recommendations[0] || (await GroqService.recommendProducts({ wardrobeItems }))[0] || {
      name: 'Classic White Oxford Shirt',
      category: 'Top',
      color: 'White',
      price: 2499,
      mrp: 3999,
      imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80',
      reason: 'A versatile staple for your wardrobe.',
    };

    const wardrobeSummary = summarizeWardrobe(wardrobeItems);
    const fashionScore = computeFashionScore(wardrobeItems, duplicateAnalysis.similarity);
    const missingEssentials = buildMissingEssentials(wardrobeItems).slice(0, 4);
    const timeline = buildTimeline(wardrobeItems, outfits, recommendations, wears);
    const shoppingImpact = [
      { label: 'New Outfits Created', value: `${outfits.length}`, tone: 'ok' },
      { label: 'Matches Existing', value: `${outfits.reduce((sum, outfit) => sum + (outfit.items?.length || 0), 0)} items`, tone: 'ok' },
      { label: 'Versatility Boost', value: `+${Math.min(45, Math.round((wardrobeItems.length / 12) * 100))}%`, tone: 'ok' },
      { label: 'Duplicate Risk', value: duplicateAnalysis.isDuplicate ? 'High' : 'Low', tone: duplicateAnalysis.isDuplicate ? 'warn' : 'ok' },
    ];

    return {
      insights: [
        { label: 'Most Worn Color', value: wardrobeSummary.mostUsedColor, sub: `${wardrobeItems.filter((item) => normalizeText(item.color) === normalizeText(wardrobeSummary.mostUsedColor)).length} items` },
        { label: 'Favorite Style', value: wardrobeSummary.favoriteStyle, sub: `${wardrobeItems.filter((item) => normalizeText(item.category) === normalizeText(wardrobeSummary.favoriteStyle)).length} items` },
        { label: 'Least Used Clothes', value: `${Math.max(0, wardrobeItems.length - outfits.reduce((sum, outfit) => sum + (outfit.items?.length || 0), 0))} items`, sub: 'Potential pieces to style' },
        { label: 'Wardrobe Value', value: `₹${wardrobeSummary.wardrobeValue}`, sub: `Est. from ${wardrobeItems.length} items` },
        { label: 'Shopping Savings', value: `₹${Math.min(wardrobeItems.length * 600, 12000)}`, sub: duplicateAnalysis.isDuplicate ? 'Duplicate items avoided' : 'Smart purchase decisions' },
        { label: 'Monthly Outfits', value: `${Math.max(outfits.length, 0)}`, sub: 'Unique combinations generated' },
      ],
      missingEssentials,
      timeline,
      fashionScore,
      shoppingImpact,
      featuredProduct,
      wardrobeItems,
      outfits,
      recommendations,
    };
  }
}

export default new AnalyticsService();
