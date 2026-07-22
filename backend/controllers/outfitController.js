import OutfitService from '../services/OutfitService.js';
import GroqService from '../services/GroqService.js';
import WardrobeService from '../services/WardrobeService.js';
import axios from 'axios';
import WeatherService from '../services/WeatherService.js';
import { createConnection } from '../config/oracle.js';

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ');
}

function matchWardrobeItem(item, wardrobeItems) {
  const name = normalizeText(item.name || item.item || '');
  const category = normalizeText(item.category || item.role || '');
  const color = normalizeText(item.color || '');

  let bestMatch = null;
  let bestScore = 0;

  for (const wardrobe of wardrobeItems) {
    const labels = [wardrobe.name, wardrobe.category, wardrobe.color, wardrobe.occasion, wardrobe.season]
      .filter(Boolean)
      .map(normalizeText);
    const nameScore = name && labels.some((label) => label.includes(name) || name.includes(label)) ? 3 : 0;
    const categoryScore = category && labels.some((label) => label.includes(category) || category.includes(label)) ? 2 : 0;
    const colorScore = color && labels.some((label) => label.includes(color) || color.includes(label)) ? 1 : 0;
    const score = nameScore + categoryScore + colorScore;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = wardrobe;
    }
  }

  if (bestMatch && bestMatch.imageUrl) {
    return bestMatch.imageUrl;
  }

  return undefined;
}

function enhanceItemsWithImages(items = [], wardrobeItems) {
  return items.map((item) => {
    const imageUrl = item.imageUrl || item.img || item.image_url || matchWardrobeItem(item, wardrobeItems);
    return {
      ...item,
      imageUrl,
    };
  });
}

function compilePreferences(wardrobeItems = []) {
  const colors = {};
  const styles = {};
  const categories = {};
  
  for (const item of wardrobeItems) {
    if (item.color) colors[item.color] = (colors[item.color] || 0) + 1;
    if (item.style) styles[item.style] = (styles[item.style] || 0) + 1;
    if (item.category) categories[item.category] = (categories[item.category] || 0) + 1;
  }
  
  const getTop = (obj) => Object.entries(obj).sort((a,b) => b[1] - a[1]).slice(0, 3).map(e => e[0]).join(', ');
  
  return `Favorite Colors: ${getTop(colors) || 'None'}; Favorite Categories: ${getTop(categories) || 'None'}; Favorite Styles: ${getTop(styles) || 'None'}`;
}

async function getRecentlyWornSignatures(userId) {
  try {
    const connection = await createConnection();
    try {
      const result = await connection.execute(
        `SELECT item_ids FROM wear_history WHERE user_id = :userId ORDER BY worn_at DESC FETCH FIRST 5 ROWS ONLY`,
        { userId }
      );
      return result.rows.map(row => {
        const itemIdsStr = row.ITEM_IDS ?? row.item_ids;
        if (!itemIdsStr) return '';
        const ids = String(itemIdsStr).split(',').map(Number);
        return ids.sort((a, b) => a - b).join('-');
      }).filter(Boolean);
    } finally {
      await connection.close();
    }
  } catch (e) {
    console.warn('[Outfit Controller] Could not fetch wear history:', e.message);
    return [];
  }
}

export async function generateOutfit(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    const wardrobeItems = await WardrobeService.list(userId);

    let lat = 19.076;
    let lon = 72.877;
    let detectedCity = 'Mumbai';
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const cleanIp = ip.split(',')[0].trim();
      let geoUrl = 'http://ip-api.com/json/';
      if (cleanIp && cleanIp !== '127.0.0.1' && cleanIp !== '::1' && cleanIp !== '::ffff:127.0.0.1' && !cleanIp.startsWith('192.168.') && !cleanIp.startsWith('10.')) {
        geoUrl = `http://ip-api.com/json/${cleanIp}`;
      }
      const geo = await axios.get(geoUrl, { timeout: 3000 });
      if (geo.data && geo.data.status === 'success') {
        lat = geo.data.lat;
        lon = geo.data.lon;
        detectedCity = geo.data.city;
      }
    } catch (e) {
      // ignore
    }

    const weatherData = await WeatherService.getWeatherByCoordinates(lat, lon, detectedCity);
    const temp = weatherData.current?.tempC ?? 28;
    const condition = weatherData.current?.condition ?? 'Sunny';
    const humidity = weatherData.current?.humidity ?? 70;
    const rainProb = (condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('drizzle')) ? 'High' : 'Low';
    const weatherDescription = `${condition}, Temp: ${temp}°C, Humidity: ${humidity}%, Rain Probability: ${rainProb}`;

    const recentlyWorn = await getRecentlyWornSignatures(userId);

    const aiResponse = await GroqService.generateOutfit({
      wardrobeItems,
      occasion: req.body.occasion || 'Casual',
      weatherDescription,
      preferences: compilePreferences(wardrobeItems),
      recentlyWorn,
    });

    const outfitsList = aiResponse.outfits || [];
    const savedOutfits = [];
    const allUsedItemIds = [];

    for (const aiOutfit of outfitsList) {
      const items = [];
      const roles = [
        { key: 'top', category: 'Topwear' },
        { key: 'bottom', category: 'Bottomwear' },
        { key: 'outerwear', category: 'Outerwear' },
        { key: 'dress', category: 'Dress' },
        { key: 'shoes', category: 'Footwear' },
        { key: 'accessory', category: 'Accessories' }
      ];

      for (const role of roles) {
        const itemId = aiOutfit[role.key];
        if (itemId) {
          const matched = wardrobeItems.find((it) => String(it.id) === String(itemId));
          if (matched) {
            items.push({
              id: matched.id,
              name: matched.name,
              category: matched.category,
              color: matched.color,
              imageUrl: matched.imageUrl,
              role: role.category
            });
            allUsedItemIds.push(matched.id);
          }
        }
      }

      if (items.length > 0) {
        const outfit = await OutfitService.generate(userId, {
          name: aiOutfit.name || 'AI Styled Outfit',
          score: aiOutfit.score || 90,
          summary: aiOutfit.reason || 'Generated from wardrobe.',
          occasion: req.body.occasion || 'Casual',
          weather: `${condition} (${temp}°C)`,
          items,
        });
        savedOutfits.push(outfit);
      }
    }

    if (allUsedItemIds.length > 0) {
      await WardrobeService.markAsWorn(userId, [...new Set(allUsedItemIds)]);
    }

    const primaryOutfit = savedOutfits[0] || {
      outfitId: 0,
      name: 'AI Styled Outfit',
      score: 88,
      summary: 'Enjoy your day!',
      weather: `${condition} (${temp}°C)`,
      occasion: req.body.occasion || 'Casual',
      items: []
    };

    res.status(201).json({ outfit: primaryOutfit, outfits: savedOutfits });
  } catch (error) {
    next(error);
  }
}

export async function listGeneratedOutfits(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    const outfits = await OutfitService.list(userId);
    res.json({ outfits });
  } catch (error) {
    next(error);
  }
}

export async function getCombinations(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    const wardrobeItems = await WardrobeService.list(userId);
    console.log(`[Combinations] User ${userId} has ${wardrobeItems?.length || 0} wardrobe items`);
    if (wardrobeItems?.length > 0) {
      console.log('[Combinations] Sample items:', wardrobeItems.slice(0, 3).map(i => ({ name: i.name, category: i.category, imageUrl: i.imageUrl ? 'present' : 'missing' })));
    }
    const combinations = OutfitService.generateCombinations(wardrobeItems);
    console.log(`[Combinations] Generated ${combinations?.length || 0} combinations`);
    res.json({ combinations });
  } catch (error) {
    console.error('[Combinations] Error:', error.message);
    next(error);
  }
}

export async function reviseOutfit(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    const { occasion, weather, previousOutfitIds = [] } = req.body;
    
    const wardrobeItems = await WardrobeService.list(userId);

    const recentlyWorn = await getRecentlyWornSignatures(userId);
    const combinedAvoid = [...new Set([...previousOutfitIds, ...recentlyWorn])];

    const aiResponse = await GroqService.generateOutfit({
      wardrobeItems,
      occasion: occasion || 'Casual',
      weatherDescription: weather || 'Sunny',
      preferences: compilePreferences(wardrobeItems),
      recentlyWorn: combinedAvoid,
    });

    const outfitsList = aiResponse.outfits || [];

    for (const aiOutfit of outfitsList) {
      const items = [];
      const roles = [
        { key: 'top', category: 'Topwear' },
        { key: 'bottom', category: 'Bottomwear' },
        { key: 'outerwear', category: 'Outerwear' },
        { key: 'dress', category: 'Dress' },
        { key: 'shoes', category: 'Footwear' },
        { key: 'accessory', category: 'Accessories' }
      ];

      const itemIds = [];
      for (const role of roles) {
        const itemId = aiOutfit[role.key];
        if (itemId) {
          const matched = wardrobeItems.find((it) => String(it.id) === String(itemId));
          if (matched) {
            items.push({
              id: matched.id,
              name: matched.name,
              category: matched.category,
              color: matched.color,
              imageUrl: matched.imageUrl,
              role: role.category
            });
            itemIds.push(matched.id);
          }
        }
      }

      if (items.length > 0) {
        const signature = itemIds.sort((a, b) => a - b).join('-');
        
        if (!previousOutfitIds.includes(signature)) {
          const outfit = await OutfitService.generate(userId, {
            name: aiOutfit.name || 'AI Styled Outfit',
            score: aiOutfit.score || 90,
            summary: aiOutfit.reason || 'Generated from wardrobe.',
            occasion: occasion || 'Casual',
            weather: weather || 'Sunny',
            items,
          });
          
          await WardrobeService.markAsWorn(userId, itemIds);
          
          return res.status(201).json({ outfit, signature });
        }
      }
    }

    return res.status(200).json({ 
      exhausted: true, 
      message: "You've explored all possible outfit combinations from your wardrobe. Try uploading more clothes for additional recommendations."
    });
  } catch (error) {
    next(error);
  }
}

export async function wearOutfit(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    const { outfitId, itemIds = [], occasion, weather } = req.body;

    if (!outfitId || itemIds.length === 0) {
      return res.status(400).json({ error: 'Outfit ID and wardrobe item IDs are required' });
    }

    const connection = await createConnection();
    try {
      const itemIdsStr = itemIds.join(',');
      await connection.execute(
        `INSERT INTO wear_history (user_id, outfit_id, item_ids, occasion, weather)
         VALUES (:userId, :outfitId, :itemIdsStr, :occasion, :weather)`,
        {
          userId,
          outfitId,
          itemIdsStr,
          occasion: occasion || 'Casual',
          weather: weather || 'Sunny'
        }
      );
      await connection.commit();
    } finally {
      await connection.close();
    }

    await WardrobeService.markAsWorn(userId, itemIds);

    res.status(200).json({ message: 'Outfit selected successfully! Enjoy your day.' });
  } catch (error) {
    console.error('[Outfit Controller] Wear Outfit failed:', error.message);
    next(error);
  }
}
