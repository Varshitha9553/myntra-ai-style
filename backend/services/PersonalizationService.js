import WardrobeService from './WardrobeService.js';
import axios from 'axios';

const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const normalize = (val = '') => String(val || '').trim();

function getMode(arr = []) {
  const filtered = arr.filter(Boolean);
  if (filtered.length === 0) return 'None';
  const counts = {};
  filtered.forEach(x => {
    counts[x] = (counts[x] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0] ? sorted[0][0] : 'None';
}

function getFrequencies(arr = []) {
  const filtered = arr.filter(Boolean);
  const counts = {};
  filtered.forEach(x => {
    counts[x] = (counts[x] || 0) + 1;
  });
  const total = filtered.length || 1;
  return Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / total) * 100)
  })).sort((a, b) => b.count - a.count);
}

class PersonalizationService {
  async getStyleProfile(userId) {
    const items = await WardrobeService.list(userId);
    if (items.length === 0) {
      return {
        totalItems: 0,
        favoriteColor: 'None',
        favoriteCategory: 'None',
        favoriteOccasion: 'None',
        favoriteSeason: 'None',
        dominantStyle: 'Casual',
        lastUpdated: 'No items yet'
      };
    }

    const categories = items.map(it => normalize(it.category));
    const colors = items.map(it => normalize(it.color));
    const occasions = items.map(it => normalize(it.occasion));
    const seasons = items.map(it => normalize(it.season));

    const favoriteCategory = getMode(categories);
    const favoriteColor = getMode(colors);
    const favoriteOccasion = getMode(occasions);
    const favoriteSeason = getMode(seasons);

    // Calculate last updated date from items
    let lastUpdated = 'Recently';
    const dates = items.map(it => it.createdAt ? new Date(it.createdAt) : null).filter(Boolean);
    if (dates.length > 0) {
      const maxDate = new Date(Math.max(...dates));
      lastUpdated = maxDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Infer dominant style based on favoriteOccasion and category
    let dominantStyle = 'Casual';
    const occ = favoriteOccasion.toLowerCase();
    if (occ.includes('formal') || occ.includes('office') || occ.includes('work')) {
      dominantStyle = 'Smart Formal';
    } else if (occ.includes('party') || occ.includes('wedding')) {
      dominantStyle = 'Festive / Party';
    } else if (occ.includes('sports') || occ.includes('gym')) {
      dominantStyle = 'Sporty Athleisure';
    } else if (occ.includes('ethnic') || occ.includes('traditional')) {
      dominantStyle = 'Indian Ethnic';
    } else if (occ.includes('street') || occ.includes('hipster')) {
      dominantStyle = 'Streetwear';
    }

    return {
      totalItems: items.length,
      favoriteColor,
      favoriteCategory,
      favoriteOccasion,
      favoriteSeason,
      dominantStyle,
      lastUpdated
    };
  }

  async getAIInsights(userId) {
    const items = await WardrobeService.list(userId);
    const profile = await this.getStyleProfile(userId);

    const staticInsights = [
      `Your wardrobe style is primarily ${profile.dominantStyle}.`,
      profile.totalItems > 0 ? `Your collection is led by ${profile.favoriteCategory} garments.` : `No items in wardrobe yet.`,
      `Most of your collection is suitable for ${profile.favoriteSeason} wear.`,
      `Your favorite color is ${profile.favoriteColor}, forming the foundation of your style.`,
      `Your closet is highly prepared for ${profile.favoriteOccasion} occasions.`
    ].filter(Boolean);

    if (items.length === 0 || !GROQ_API_KEY) {
      return staticInsights;
    }

    try {
      const payload = {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: `You are an expert personal stylist. Analyze this user wardrobe summary and generate exactly 4-5 short, conversational style insights.
Total Closet Items: ${profile.totalItems}
Dominant Style: ${profile.dominantStyle}
Favorite Category: ${profile.favoriteCategory}
Favorite Color: ${profile.favoriteColor}
Favorite Occasion: ${profile.favoriteOccasion}
Favorite Season: ${profile.favoriteSeason}

Return ONLY a JSON array of strings, for example:
[
  "Your wardrobe is mostly casual and street-friendly.",
  "Blue is your most frequently worn color, making color coordinates easy.",
  "You are highly prepared for office wear and smart-casual meetings.",
  "Most of your clothes are optimized for summer outings."
]
Do not return any other text, markdown blocks, or commentary.`
          }
        ],
        temperature: 0.2
      };

      const response = await axios.post(GROQ_API_URL, payload, {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const content = response.data?.choices?.[0]?.message?.content;
      if (content) {
        let text = content.trim();
        const match = text.match(/\[([\s\S]*?)\]/);
        if (match) {
          text = match[0];
        }
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return staticInsights;
    } catch (err) {
      console.warn('[Personalization Service] Groq AI insights failed, falling back to static:', err.message);
      return staticInsights;
    }
  }

  async getAnalytics(userId) {
    const items = await WardrobeService.list(userId);
    if (items.length === 0) {
      return {
        categories: [],
        colors: [],
        occasions: [],
        seasons: []
      };
    }

    const categories = items.map(it => normalize(it.category));
    const colors = items.map(it => normalize(it.color));
    const occasions = items.map(it => normalize(it.occasion));
    const seasons = items.map(it => normalize(it.season));

    return {
      categories: getFrequencies(categories),
      colors: getFrequencies(colors),
      occasions: getFrequencies(occasions),
      seasons: getFrequencies(seasons)
    };
  }
}

export default new PersonalizationService();
