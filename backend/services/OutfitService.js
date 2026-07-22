import { createConnection } from '../config/oracle.js';
import oracledb from 'oracledb';

class OutfitService {
  async generate(userId, payload) {
    const connection = await createConnection();
    try {
      const result = await connection.execute(
        `INSERT INTO generated_outfits (user_id, name, occasion, weather, score, summary, items)
         VALUES (:userId, :name, :occasion, :weather, :score, :summary, :items)
         RETURNING outfit_id INTO :outfitId`,
        {
          userId,
          name: payload.name || 'AI Styled Outfit',
          occasion: payload.occasion || 'Office',
          weather: payload.weather || 'Sunny',
          score: payload.score || 92,
          summary: payload.summary || 'Generated from the wardrobe.',
          items: JSON.stringify(payload.items || []),
          outfitId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
        }
      );
      await connection.commit();
      return {
        outfitId: result.outBinds.outfitId[0],
        name: payload.name || 'AI Styled Outfit',
        occasion: payload.occasion || 'Office',
        weather: payload.weather || 'Sunny',
        score: payload.score || 92,
        summary: payload.summary || 'Generated from the wardrobe.',
        items: payload.items || [],
      };
    } finally {
      await connection.close();
    }
  }

  async list(userId) {
    const connection = await createConnection();
    try {
      const result = await connection.execute(
        `SELECT outfit_id, user_id, name, occasion, weather, score, summary, items, created_at, updated_at
         FROM generated_outfits WHERE user_id = :userId ORDER BY created_at DESC`,
        { userId }
      );
      return result.rows.map((row) => ({
        outfitId: row.OUTFIT_ID ?? row.outfit_id,
        userId: row.USER_ID ?? row.user_id,
        name: row.NAME ?? row.name,
        occasion: row.OCCASION ?? row.occasion,
        weather: row.WEATHER ?? row.weather,
        score: row.SCORE ?? row.score,
        summary: row.SUMMARY ?? row.summary,
        items: (() => {
          try {
            return JSON.parse(row.ITEMS || row.items || '[]');
          } catch {
            return [];
          }
        })(),
        createdAt: row.CREATED_AT ?? row.created_at,
        updatedAt: row.UPDATED_AT ?? row.updated_at,
      }));
    } finally {
      await connection.close();
    }
  }

  generateCombinations(wardrobeItems = []) {
    const normalize = (val) => String(val || '').toLowerCase().trim();
    const tops = wardrobeItems.filter((item) => 
      item && normalize(item.category) === 'topwear'
    );
    const bottoms = wardrobeItems.filter((item) => 
      item && normalize(item.category) === 'bottomwear'
    );
    const accessories = wardrobeItems.filter((item) => 
      item && ['accessories', 'footwear', 'outerwear', 'dress'].includes(normalize(item.category))
    );

    if (tops.length === 0 || bottoms.length === 0) {
      return [];
    }

    const colorDistance = (c1, c2) => {
      const colors = { black: 0, white: 1, red: 2, blue: 3, green: 4, yellow: 5, orange: 6, purple: 7, pink: 8, gray: 9, brown: 10, beige: 11, navy: 3 };
      const n1 = normalize(c1);
      const n2 = normalize(c2);
      const v1 = Object.keys(colors).find((k) => n1.includes(k)) || n1.charCodeAt(0);
      const v2 = Object.keys(colors).find((k) => n2.includes(k)) || n2.charCodeAt(0);
      const d = Math.abs(v1 - v2);
      return Math.max(0, 100 - d * 5);
    };

    const styleScore = (items) => {
      const hasSeasons = new Set(items.filter((i) => i && i.season).map((i) => normalize(i.season))).size;
      const hasOccasions = new Set(items.filter((i) => i && i.occasion).map((i) => normalize(i.occasion))).size;
      const hasPatterns = new Set(items.filter((i) => i && i.pattern).map((i) => normalize(i.pattern))).size;
      return Math.min(100, 60 + hasSeasons * 10 + hasOccasions * 10 + hasPatterns * 5);
    };

    const combinations = [];
    for (const top of tops) {
      for (const bottom of bottoms) {
        const baseItems = [top, bottom];
        const selectedAccessories = accessories.slice(0, Math.min(2, accessories.length));
        const allItems = [...baseItems, ...selectedAccessories];

        // Ensure all items have required fields
        const enrichedItems = allItems.map((item) => ({
          id: item.id,
          name: item.name || 'Unknown Item',
          imageUrl: item.imageUrl || '',
          category: item.category || 'Unknown',
          color: item.color || 'Unknown',
          brand: item.brand || '',
          occasion: item.occasion || '',
          season: item.season || '',
          pattern: item.pattern || '',
        }));

        const colorMatch = colorDistance(top.color, bottom.color);
        const seasonMatch = Math.min(100, 60 + (enrichedItems.filter((i) => i.season).length * 15));
        const balance = styleScore(enrichedItems);
        const occasionMatch = Math.min(100, 70 + (enrichedItems.filter((i) => i.occasion).length * 10));

        const score = Math.round((colorMatch * 0.25 + seasonMatch * 0.25 + balance * 0.25 + occasionMatch * 0.25) * 0.98);

        combinations.push({
          id: `${top.id}-${bottom.id}-${selectedAccessories.map((a) => a.id).join('-')}`,
          name: `${top.name} & ${bottom.name}`,
          items: enrichedItems,
          score: Math.max(50, Math.min(99, score)),
          colors: [top.color, bottom.color].filter(Boolean),
          reason: `${top.color} ${top.name} pairs well with ${bottom.color} ${bottom.name}${selectedAccessories.length ? ' and accessories' : ''}.`,
        });
      }
    }

    return combinations.sort((a, b) => b.score - a.score).slice(0, 12);
  }
}

export default new OutfitService();
