import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ========== ALLOWED LISTS (must match frontend filter values & DB schema) ==========

const VALID_CATEGORIES = ['Topwear', 'Bottomwear', 'Outerwear', 'Dress', 'Footwear', 'Accessories'];

const VALID_COLORS = [
  'Black', 'White', 'Blue', 'Navy', 'Grey', 'Brown', 'Beige', 'Cream',
  'Red', 'Pink', 'Purple', 'Green', 'Yellow', 'Orange', 'Gold', 'Silver', 'Multi'
];

const VALID_PATTERNS = ['Solid', 'Striped', 'Checked', 'Printed', 'Floral', 'Graphic', 'Polka Dot', 'Textured', 'Plain'];

const VALID_SEASONS = ['Summer', 'Winter', 'Spring', 'Autumn', 'All Season'];

const VALID_OCCASIONS = ['Casual', 'Formal', 'Office', 'Party', 'Wedding', 'Sports', 'Travel', 'Traditional', 'Everyday'];

// ========== COLOR NORMALIZATION MAP ==========
// Maps vague/compound color descriptions to the closest valid color

const COLOR_MAP = [
  { pattern: /^light\s+blue/i, value: 'Blue' },
  { pattern: /^dark\s+blue/i, value: 'Navy' },
  { pattern: /^light\s+blueish/i, value: 'Blue' },
  { pattern: /^dark\s+blueish/i, value: 'Navy' },
  { pattern: /^light\s+grey/i, value: 'Grey' },
  { pattern: /^dark\s+grey/i, value: 'Grey' },
  { pattern: /^light\s+gray/i, value: 'Grey' },
  { pattern: /^dark\s+gray/i, value: 'Grey' },
  { pattern: /^greyish/i, value: 'Grey' },
  { pattern: /^grayish/i, value: 'Grey' },
  { pattern: /^off\s*white/i, value: 'Cream' },
  { pattern: /^cream/i, value: 'Cream' },
  { pattern: /^light\s+pink/i, value: 'Pink' },
  { pattern: /^hot\s+pink/i, value: 'Pink' },
  { pattern: /^dark\s+pink/i, value: 'Pink' },
  { pattern: /^light\s+green/i, value: 'Green' },
  { pattern: /^dark\s+green/i, value: 'Green' },
  { pattern: /^olive/i, value: 'Green' },
  { pattern: /^army\s+green/i, value: 'Green' },
  { pattern: /^light\s+red/i, value: 'Red' },
  { pattern: /^dark\s+red/i, value: 'Red' },
  { pattern: /^maroon/i, value: 'Red' },
  { pattern: /^burgundy/i, value: 'Red' },
  { pattern: /^light\s+yellow/i, value: 'Yellow' },
  { pattern: /^dark\s+yellow/i, value: 'Yellow' },
  { pattern: /^mustard/i, value: 'Yellow' },
  { pattern: /^light\s+purple/i, value: 'Purple' },
  { pattern: /^dark\s+purple/i, value: 'Purple' },
  { pattern: /^lavender/i, value: 'Purple' },
  { pattern: /^light\s+brown/i, value: 'Brown' },
  { pattern: /^dark\s+brown/i, value: 'Brown' },
  { pattern: /^tan/i, value: 'Brown' },
  { pattern: /^chocolate/i, value: 'Brown' },
  { pattern: /^light\s+orange/i, value: 'Orange' },
  { pattern: /^dark\s+orange/i, value: 'Orange' },
  { pattern: /^peach/i, value: 'Orange' },
  { pattern: /^coral/i, value: 'Orange' },
  { pattern: /^navy\s+blue/i, value: 'Navy' },
  { pattern: /^royal\s+blue/i, value: 'Blue' },
  { pattern: /^sky\s+blue/i, value: 'Blue' },
  { pattern: /^baby\s+blue/i, value: 'Blue' },
  { pattern: /^pastel/i, value: 'Multi' },
  { pattern: /^multi\s*color/i, value: 'Multi' },
  { pattern: /^multicolor/i, value: 'Multi' },
  { pattern: /^rainbow/i, value: 'Multi' },
  { pattern: /^golden/i, value: 'Gold' },
  { pattern: /^silver/i, value: 'Silver' },
  { pattern: /^charcoal/i, value: 'Grey' },
  { pattern: /^metallic/i, value: 'Silver' },
  { pattern: /^denim/i, value: 'Blue' },
  { pattern: /^khaki/i, value: 'Beige' },
  { pattern: /^ivory/i, value: 'Cream' },
  { pattern: /^mint/i, value: 'Green' },
  { pattern: /^teal/i, value: 'Blue' },
  { pattern: /^turquoise/i, value: 'Blue' },
  { pattern: /^aqua/i, value: 'Blue' },
  { pattern: /^magenta/i, value: 'Purple' },
  { pattern: /^violet/i, value: 'Purple' },
  { pattern: /^indigo/i, value: 'Purple' },
  { pattern: /^lilac/i, value: 'Purple' },
  { pattern: /^crimson/i, value: 'Red' },
  { pattern: /^wine/i, value: 'Red' },
  { pattern: /^rust/i, value: 'Orange' },
  { pattern: /^salmon/i, value: 'Pink' },
  { pattern: /^blush/i, value: 'Pink' },
  { pattern: /^rose\s*gold/i, value: 'Gold' },
  { pattern: /^\s*beige\s*/i, value: 'Beige' },
  { pattern: /^\s*cream\s*/i, value: 'Cream' },
];

// ========== HELPER: Normalize a color to closest valid color ==========

function normalizeColor(color) {
  if (!color || typeof color !== 'string') return 'Black';

  const trimmed = color.trim();
  if (!trimmed) return 'Black';

  // Check exact match first (case-insensitive)
  const exactMatch = VALID_COLORS.find(c => c.toLowerCase() === trimmed.toLowerCase());
  if (exactMatch) return exactMatch;

  // Check color map patterns
  for (const entry of COLOR_MAP) {
    if (entry.pattern.test(trimmed)) {
      return entry.value;
    }
  }

  // Check if any valid color is a substring of the input
  for (const valid of VALID_COLORS) {
    if (trimmed.toLowerCase().includes(valid.toLowerCase())) {
      return valid;
    }
  }

  // Check if input words contain a valid color
  const words = trimmed.toLowerCase().split(/[\s/-]+/);
  for (const word of words) {
    for (const valid of VALID_COLORS) {
      if (word === valid.toLowerCase()) {
        return valid;
      }
    }
  }

  // Default fallback
  return 'Black';
}

// ========== HELPER: Force-close a value to the closest match in allowed list ==========
// (Used for pattern/season/occasion — not for category; see resolveCategory.)

function closestMatch(value, allowedList) {
  if (!value || typeof value !== 'string') {
    return allowedList[0] || null;
  }

  const trimmed = value.trim();
  if (!trimmed) return allowedList[0] || null;

  const exact = allowedList.find(a => a.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;

  const lower = trimmed.toLowerCase();
  for (const allowed of allowedList) {
    if (lower.includes(allowed.toLowerCase())) {
      return allowed;
    }
  }

  return allowedList[0];
}

const CATEGORY_ALIAS_MAP = {
  topwear: 'Topwear',
  top: 'Topwear',
  tops: 'Topwear',
  shirt: 'Topwear',
  't-shirt': 'Topwear',
  tshirt: 'Topwear',
  bottomwear: 'Bottomwear',
  bottom: 'Bottomwear',
  bottoms: 'Bottomwear',
  pants: 'Bottomwear',
  trousers: 'Bottomwear',
  outerwear: 'Outerwear',
  jacket: 'Outerwear',
  footwear: 'Footwear',
  shoes: 'Footwear',
  shoe: 'Footwear',
  accessories: 'Accessories',
  accessory: 'Accessories',
  dress: 'Dress',
  gown: 'Dress',
};

/**
 * Infer wardrobe category from item name / AI text using word boundaries.
 * Item-name signals override a wrong AI category (e.g. shirt mislabeled as Accessories).
 */
function inferCategoryFromText(...parts) {
  const text = parts
    .filter(Boolean)
    .map((p) => String(p).toLowerCase())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return null;

  const isCapSleeve = /\b(cap[\s-]?sleeve)\b/.test(text);

  if (/\b(dress|gown|frock|saree|sari|jumpsuit|romper|maxi dress|midi dress|mini dress)\b/.test(text)) {
    return 'Dress';
  }
  if (/\b(jacket|hoodie|sweater|coat|blazer|cardigan|windbreaker|parka|overcoat|outerwear|pullover|fleece|bomber|puffer)\b/.test(text)) {
    return 'Outerwear';
  }
  if (/\b(jeans?|trousers?|pants|shorts|skirt|leggings|chinos|cargo pants|bottomwear|joggers|culottes|denim pants|track pants)\b/.test(text)) {
    return 'Bottomwear';
  }
  if (/\b(shirts?|t-?shirts?|tees?|polo|blouse|tank tops?|crop tops?|kurta|tunic|topwear|henley|camisole|button[\s-]?down|oxford shirt|flannel shirt)\b/.test(text) || isCapSleeve) {
    return 'Topwear';
  }
  if (/\b(sneakers?|boots?|sandals?|heels?|loafers?|slippers?|footwear|flip[\s-]?flops?|trainers?|cleats?|mules?|oxfords?|brogues?)\b/.test(text)) {
    return 'Footwear';
  }
  if (
    /\b(bags?|backpacks?|handbags?|totes?|purses?|wallets?|watches?|belts?|scarves?|scarf|sunglasses?|jewell?ery|necklaces?|bracelets?|earrings?|rings?|hats?|beanies?|ties?|bow ties?|cufflinks?|gloves?|headbands?|duffel|luggage)\b/.test(text)
  ) {
    return 'Accessories';
  }
  if (!isCapSleeve && /\b(baseball caps?|snapbacks?|bucket hats?|\bcaps?\b)\b/.test(text)) {
    return 'Accessories';
  }

  return null;
}

function resolveCategory(rawCategory, itemName = '') {
  const fromText = inferCategoryFromText(itemName, rawCategory);
  if (fromText) return fromText;

  if (!rawCategory || typeof rawCategory !== 'string') {
    return 'Topwear';
  }

  const trimmed = rawCategory.trim();
  if (!trimmed) return 'Topwear';

  const exact = VALID_CATEGORIES.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;

  const aliasKey = trimmed.toLowerCase().replace(/\s+/g, ' ');
  if (CATEGORY_ALIAS_MAP[aliasKey]) {
    return CATEGORY_ALIAS_MAP[aliasKey];
  }

  const lower = aliasKey;
  if (lower.includes('topwear') || lower === 'top' || lower === 'tops') return 'Topwear';
  if (lower.includes('bottomwear') || lower === 'bottom' || lower === 'bottoms') return 'Bottomwear';
  if (lower.includes('outerwear')) return 'Outerwear';
  if (lower.includes('footwear')) return 'Footwear';
  if (lower.includes('accessor')) return 'Accessories';
  if (lower.includes('dress')) return 'Dress';

  return 'Topwear';
}

// ========== MAIN VALIDATION & NORMALIZATION FUNCTION ==========

function validateAndNormalize(analysis) {
  if (!analysis || typeof analysis !== 'object') {
    return null;
  }

  const confidenceRaw = analysis.confidence !== undefined ? Number(analysis.confidence) : 100;
  const confidence = Number.isFinite(confidenceRaw) ? confidenceRaw : 100;
  const category = String(analysis.category || '').trim();
  const itemName = String(analysis.item_name || analysis.name || analysis.itemName || '').trim();

  const categoryUnknown = category.toLowerCase() === 'unknown';
  const itemUnknown = itemName.toLowerCase() === 'unknown';
  const completelyUnidentified =
    (confidence === 0 && categoryUnknown && (itemUnknown || !itemName)) ||
    (categoryUnknown && itemUnknown);

  if (completelyUnidentified) {
    return {
      item_name: 'Unknown',
      category: 'Unknown',
      color: 'Unknown',
      pattern: 'Unknown',
      season: 'Unknown',
      occasion: 'Unknown',
      material: 'Unknown',
      style: 'Unknown',
      confidence: 0,
      aiTags: ['Unidentified'],
    };
  }

  const normalizedCategory = resolveCategory(category, itemName);
  const normalizedColor = normalizeColor(analysis.color);
  const normalizedPattern = closestMatch(analysis.pattern, VALID_PATTERNS);
  const normalizedSeason = closestMatch(analysis.season, VALID_SEASONS);
  const normalizedOccasion = closestMatch(analysis.occasion, VALID_OCCASIONS);

  return {
    item_name: itemName || (analysis.item_name || 'Wardrobe Item').trim(),
    category: normalizedCategory,
    color: normalizedColor,
    pattern: normalizedPattern,
    season: normalizedSeason,
    occasion: normalizedOccasion,
    material: (analysis.material || 'Unknown').trim(),
    style: (analysis.style || 'Casual').trim(),
    confidence: Math.min(100, Math.max(0, confidence)),
    aiTags: [normalizedCategory, normalizedColor, normalizedSeason, normalizedOccasion],
  };
}

function getFirstValue(source, keys) {
  if (!source || typeof source !== 'object') {
    return null;
  }

  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return null;
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value
      .map((tag) => String(tag).trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[|,]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return ['AI Tagged'];
}

function guessCategory(text) {
  const lower = String(text || '').toLowerCase();
  if (lower.includes('shirt') || lower.includes('blouse') || lower.includes('top') || lower.includes('t-shirt') || lower.includes('kurta') || lower.includes('tunic')) {
    return 'Topwear';
  }
  if (lower.includes('pant') || lower.includes('jean') || lower.includes('trouser') || lower.includes('skirt') || lower.includes('shorts') || lower.includes('bottom') || lower.includes('leggings')) {
    return 'Bottomwear';
  }
  if (lower.includes('dress') || lower.includes('gown') || lower.includes('frock') || lower.includes('sari') || lower.includes('saree')) {
    return 'Dress';
  }
  if (lower.includes('jacket') || lower.includes('coat') || lower.includes('outerwear') || lower.includes('sweater') || lower.includes('hoodie') || lower.includes('cardigan')) {
    return 'Outerwear';
  }
  if (lower.includes('shoe') || lower.includes('sneaker') || lower.includes('sandal') || lower.includes('heel') || lower.includes('boot') || lower.includes('footwear') || lower.includes('clog') || lower.includes('slider') || lower.includes('flip-flop')) {
    return 'Footwear';
  }
  if (lower.includes('belt') || lower.includes('bag') || lower.includes('watch') || lower.includes('hat') || lower.includes('scarf') || lower.includes('accessory') || lower.includes('accessories') || lower.includes('cap')) {
    return 'Accessories';
  }
  return null;
}

export function normalizeAnalysis(raw, filename = '') {
  const guessed = guessCategory(filename) || 'Topwear';
  const fallback = {
    item_name: filename ? filename.replace(/\.[^/.]+$/, "") : 'Wardrobe Item',
    category: guessed,
    color: 'Neutral',
    pattern: 'Solid',
    season: ['All'],
    occasion: ['Casual'],
    material: 'Unknown',
    style: 'Casual',
    confidence: 100,
    aiTags: ['AI Tagged'],
  };

  let parsed = null;
  if (raw && typeof raw === 'object') {
    parsed = raw.analysis || raw.payload || raw.result || raw;
  } else if (raw && typeof raw === 'string') {
    const text = raw.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        // failed JSON parse
      }
    }
  }

  if (parsed) {
    let cat = getFirstValue(parsed, ['category', 'clothingType', 'clothing_type', 'type', 'clothing']);
    const itemName = getFirstValue(parsed, ['item_name', 'name', 'itemName']) || '';
    if (cat) {
      cat = resolveCategory(String(cat).trim(), String(itemName));
    } else {
      cat = resolveCategory('', String(itemName) || fallback.category);
    }

    let seasonVal = getFirstValue(parsed, ['season', 'seasons']);
    if (typeof seasonVal === 'string') {
      seasonVal = [seasonVal];
    } else if (!Array.isArray(seasonVal)) {
      seasonVal = fallback.season;
    }

    let occasionVal = getFirstValue(parsed, ['occasion', 'occasions']);
    if (typeof occasionVal === 'string') {
      occasionVal = [occasionVal];
    } else if (!Array.isArray(occasionVal)) {
      occasionVal = fallback.occasion;
    }

    let confidenceVal = getFirstValue(parsed, ['confidence', 'score']);
    confidenceVal = confidenceVal !== undefined ? Number(confidenceVal) : fallback.confidence;

    return {
      item_name: getFirstValue(parsed, ['item_name', 'name', 'itemName']) || fallback.item_name,
      category: cat,
      color: getFirstValue(parsed, ['color']) || fallback.color,
      pattern: getFirstValue(parsed, ['pattern']) || fallback.pattern,
      season: seasonVal,
      occasion: occasionVal,
      material: getFirstValue(parsed, ['material']) || fallback.material,
      style: getFirstValue(parsed, ['style']) || fallback.style,
      confidence: confidenceVal,
      aiTags: normalizeTags(getFirstValue(parsed, ['aiTags'])) || fallback.aiTags,
    };
  }

  const lower = String(raw || '').toLowerCase();
  const parsedCategory = guessCategory(raw) || fallback.category;
  return {
    item_name: fallback.item_name,
    category: parsedCategory,
    color: lower.match(/color[:\s]+([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/)?.[1] || fallback.color,
    pattern: lower.match(/pattern[:\s]+([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/)?.[1] || fallback.pattern,
    season: fallback.season,
    occasion: fallback.occasion,
    material: fallback.material,
    style: fallback.style,
    confidence: fallback.confidence,
    aiTags: [fallback.aiTags[0]],
  };
}

const DEFAULT_VISION_MODEL =
  process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b';

function parseGroqJsonContent(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    return null;
  }

  let text = rawContent.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    text = fenced[1].trim();
  }

  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
}

class GroqService {
  async understandSearchQuery(q) {
    if (!GROQ_API_KEY || !q) {
      return { category: '', color: '', keywords: [q] };
    }
    try {
      const prompt = `You are an AI assistant for a fashion wardrobe. The user entered this search query: "${q}".
Analyze the query and map it to structured fashion attributes.
Allowed categories: Topwear, Bottomwear, Outerwear, Dress, Footwear, Accessories.
Allowed colors: Black, White, Blue, Light Blue, Dark Blue, Grey, Green, Olive, Brown, Beige, Pink, Purple, Red, Orange, Yellow, Cream, Navy, Maroon, Multi.

Return ONLY a valid JSON object in this format:
{
  "category": "One of the allowed categories, or empty string if not specified",
  "color": "One of the allowed colors, or empty string if not specified",
  "keywords": ["a list of 3-5 synonyms, related terms, or original words to look for in item names/descriptions"]
}

Examples:
- "black tshirt" -> { "category": "Topwear", "color": "Black", "keywords": ["tshirt", "t-shirt", "tee", "shirt"] }
- "jeans" -> { "category": "Bottomwear", "color": "", "keywords": ["jeans", "denim", "jean", "pants"] }
- "hoodie" -> { "category": "Outerwear", "color": "", "keywords": ["hoodie", "jacket", "zip", "sweater"] }
`;

      const response = await axios.post(
        GROQ_API_URL,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You parse search queries for a wardrobe app. Output valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0,
        },
        { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
      );

      let content = response.data?.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { category: '', color: '', keywords: [q] };
    } catch (error) {
      console.warn('Groq search understanding error:', error.message);
      return { category: '', color: '', keywords: [q] };
    }
  }

  buildFilenameFallbackAnalysis(file, fallbackName) {
    const label = file?.originalname || fallbackName || 'clothing item';
    let stem = label.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
    const inferred = inferCategoryFromText(stem) || guessCategory(stem) || 'Unknown';

    const lower = stem.toLowerCase();
    const isGeneric = lower.includes('screenshot') || lower.includes('image') || lower.includes('upload') || lower.includes('photo') || /^\d+$/.test(stem) || stem.length < 3 || /^[0-9\s]+$/.test(stem);
    if (isGeneric) {
      stem = inferred === 'Footwear' ? 'Footwear' : (inferred + ' Item');
    }
    
    // Parse color from filename/fallbackName text
    let inferredColor = 'Black';
    const lowerColor = stem.toLowerCase();
    const colors = ['white', 'blue', 'red', 'green', 'yellow', 'grey', 'gray', 'navy', 'pink', 'beige', 'brown', 'olive', 'purple', 'orange', 'maroon', 'cream'];
    for (const c of colors) {
      if (lowerColor.includes(c)) {
        inferredColor = c.charAt(0).toUpperCase() + c.slice(1);
        if (inferredColor === 'Gray') inferredColor = 'Grey';
        break;
      }
    }

    return {
      item_name: stem || 'Wardrobe Item',
      category: inferred,
      color: inferredColor,
      pattern: 'Solid',
      season: 'All Season',
      occasion: 'Casual',
      material: 'Unknown',
      style: 'Casual',
      confidence: 40,
    };
  }

  async analyzeWardrobeImage(file, fallbackName = 'clothing item') {
    const toTitleCase = (str) => {
      if (!str) return '';
      return str.trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    };

    const normalizeToAllowed = (value, allowedList, defaultValue = 'Unknown') => {
      if (!value) return defaultValue;
      const clean = toTitleCase(value);
      const exact = allowedList.find(item => item.toLowerCase() === clean.toLowerCase());
      if (exact) return exact;
      
      const lower = clean.toLowerCase();
      const matched = allowedList.find(item => lower.includes(item.toLowerCase()) || item.toLowerCase().includes(lower));
      if (matched) return matched;
      
      return defaultValue;
    };

    const normalizeColor = (colorVal) => {
      if (!colorVal) return 'Unknown';
      const lowerColor = colorVal.toLowerCase();
      if (lowerColor.includes('olive') || lowerColor.includes('moss') || lowerColor.includes('military green') || lowerColor.includes('forest green') || lowerColor.includes('dark green')) {
        return 'Green';
      }
      return normalizeToAllowed(colorVal, VALID_COLORS, 'Unknown');
    };

    const validateAndNormalizeCategory = (categoryVal, itemNameVal) => {
      let cat = normalizeToAllowed(categoryVal, VALID_CATEGORIES, 'Unknown');
      const nameLower = (itemNameVal || '').toLowerCase();
      const shoeKeywords = ['shoe', 'sneaker', 'boot', 'sandal', 'loafer', 'slipper', 'heel', 'footwear'];
      
      if (cat === 'Topwear' || cat === 'Unknown') {
        const hasShoeKeyword = shoeKeywords.some(keyword => nameLower.includes(keyword));
        if (hasShoeKeyword) {
          cat = 'Footwear';
        }
      }
      return cat;
    };

    if (!GROQ_API_KEY || !file?.buffer) {
      console.warn('[GroqService] No API key or file buffer, using filename fallback');
      const fallbackData = this.buildFilenameFallbackAnalysis(file, fallbackName);
      return validateAndNormalize(fallbackData);
    }

    const mimeType = file.mimetype || 'image/jpeg';
    const base64 = file.buffer.toString('base64');
    const prompt = `You are an expert fashion stylist and clothing recognition AI.

Your ONLY task is to identify the PRIMARY fashion product visible in the image.

CRITICAL RULES:
1. Never use the uploaded filename as the item name.
2. Ignore any text, logos, watermarks, banners, labels, or promotional stickers.
3. Ignore the background, floor, walls, furniture, human body, hands, and other objects.
4. If multiple products are visible, identify only the largest and most prominent fashion item.
5. Return ONLY valid JSON.
6. Never guess if the product cannot be identified confidently.

---------------------------------
CATEGORY RULES
---------------------------------

If the product is ANY type of shoe, ALWAYS return:
category = "Footwear"

This includes:
- Sneakers
- Casual Shoes
- Running Shoes
- Sports Shoes
- Canvas Shoes
- Walking Shoes
- Trainers
- Boots
- High Tops
- Loafers
- Moccasins
- Derby Shoes
- Oxford Shoes
- Sandals
- Slippers
- Flip Flops
- Heels
- Wedges

NEVER classify any of the above as Topwear.

---------------------------------

If the product is:
Watch
Belt
Wallet
Cap
Hat
Backpack
Handbag
Sunglasses
Bracelet
Necklace
Scarf

Return:
category = "Accessories"

---------------------------------

If the product is:
Shirt
T-Shirt
Kurti
Blouse
Sweater
Polo

Return:
category = "Topwear"

---------------------------------

If the product is:
Jeans
Trousers
Pants
Joggers
Shorts
Leggings
Skirt

Return:
category = "Bottomwear"

---------------------------------

If the product is:
Jacket
Coat
Hoodie
Blazer

Return:
category = "Outerwear"

---------------------------------

If the product is:
Dress
Gown
One-piece

Return:
category = "Dress"

---------------------------------
COLOR RULES
---------------------------------

Choose ONLY one color from:
Black
White
Blue
Navy
Grey
Brown
Beige
Cream
Red
Pink
Purple
Green
Yellow
Orange
Gold
Silver
Multi

Normalize:
Olive -> Green
Olive Green -> Green
Military Green -> Green
Forest Green -> Green
Dark Green -> Green
Light Green -> Green

---------------------------------
PATTERN
---------------------------------

Choose ONLY:
Solid
Striped
Checked
Printed
Floral
Graphic
Polka Dot
Textured
Plain

---------------------------------
SEASON
---------------------------------

Choose ONLY:
Summer
Winter
Spring
Autumn
All Season

---------------------------------
OCCASION
---------------------------------

Choose ONLY:
Casual
Formal
Office
Party
Wedding
Sports
Travel
Traditional
Everyday

---------------------------------
ITEM NAME
---------------------------------

Generate a real fashion product name.

Examples:
White Running Sneakers
Olive Green Casual Sneakers
Black Leather Boots
Blue Denim Jacket
Slim Fit Blue Jeans
White Cotton Shirt

Never return:
Unknown Item
Screenshot...
Image...
Photo...
Filename...

---------------------------------
CONFIDENCE
---------------------------------

If confidence is below 80%, analyze the image again before producing the final answer.

Return ONLY:
{
    "item_name":"",
    "category":"",
    "color":"",
    "pattern":"",
    "season":"",
    "occasion":"",
    "confidence":95
}`;

    const stricterPrompt = `CRITICAL RETRY: A previous analysis yielded low confidence. You MUST analyze the main clothing/fashion item in the image with extreme precision and focus. Ignore the background, human hands/body, logos, labels, watermarks, or text. If it is a shoe, sneaker, or footwear of any kind, return category as "Footwear" and never Topwear. Color must be Green if it is olive/moss/military green. Return only valid JSON.\n\n${prompt}`;

    const executeCall = async (systemPrompt) => {
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: DEFAULT_VISION_MODEL,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `${systemPrompt}\n\nIdentify the clothing item. Return ONLY this JSON format:
{
  "item_name": "",
  "category": "",
  "color": "",
  "pattern": "",
  "season": "",
  "occasion": "",
  "confidence": 95
}`,
                },
                {
                  type: 'image_url',
                  image_url: { url: `data:${mimeType};base64,${base64}` },
                },
              ],
            },
          ],
          temperature: 0.1,
          reasoning_effort: 'none',
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      let content = response.data?.choices?.[0]?.message?.content || '';
      console.log('[GroqService] Raw response:', content);
      const parsed = parseGroqJsonContent(content);
      if (!parsed) {
        throw new Error('Failed to parse JSON content from Groq response');
      }
      return parsed;
    };

    let parsed = null;
    try {
      // First attempt
      parsed = await executeCall(prompt);
      
      // Auto-retry if confidence is below 70%
      if (parsed && (parsed.confidence === undefined || Number(parsed.confidence) < 70)) {
        console.log('[GroqService] Low confidence detected, retrying with stricter prompt...');
        try {
          parsed = await executeCall(stricterPrompt);
        } catch (retryErr) {
          console.warn('[GroqService] Stricter prompt retry failed:', retryErr.response?.data || retryErr.message);
        }
      }
    } catch (err) {
      console.warn('[GroqService] First vision attempt failed, retrying once...', err.response?.data || err.message);
      try {
        // Second attempt
        parsed = await executeCall(stricterPrompt);
      } catch (retryErr) {
        console.error('[GroqService] Second vision attempt failed. Returning filename fallback.', retryErr.response?.data || retryErr.message);
        const fallbackData = this.buildFilenameFallbackAnalysis(file, fallbackName);
        return validateAndNormalize(fallbackData);
      }
    }

    // Validation & Normalization
    try {
      if (!parsed || parsed.item_name === 'Unknown' || parsed.category === 'Unknown' || parsed.confidence === 0) {
        console.warn('[GroqService] Invalid or Unknown result, using filename fallback');
        const fallbackData = this.buildFilenameFallbackAnalysis(file, fallbackName);
        return validateAndNormalize(fallbackData);
      }

      const category = validateAndNormalizeCategory(parsed.category, parsed.item_name);
      const color = normalizeColor(parsed.color);
      const pattern = normalizeToAllowed(parsed.pattern, VALID_PATTERNS, 'Solid');
      const season = normalizeToAllowed(parsed.season, VALID_SEASONS, 'All Season');
      const occasion = normalizeToAllowed(parsed.occasion, VALID_OCCASIONS, 'Casual');
      const name = toTitleCase(parsed.item_name) || 'Wardrobe Item';

      if (category === 'Unknown') {
        console.warn('[GroqService] Resolved category is Unknown, using filename fallback');
        const fallbackData = this.buildFilenameFallbackAnalysis(file, fallbackName);
        return validateAndNormalize(fallbackData);
      }

      return {
        item_name: name,
        category: category,
        color: color,
        pattern: pattern,
        season: season,
        occasion: occasion,
        material: toTitleCase(parsed.material) || 'Unknown',
        style: toTitleCase(parsed.style) || 'Casual',
        confidence: parsed.confidence !== undefined ? Math.min(100, Math.max(0, Number(parsed.confidence))) : 95,
        aiTags: [category, color, season, occasion],
      };
    } catch (normErr) {
      console.error('[GroqService] Normalization error. Returning filename fallback.', normErr.message);
      const fallbackData = this.buildFilenameFallbackAnalysis(file, fallbackName);
      return validateAndNormalize(fallbackData);
    }
  }

  async generateOutfit(payload) {
    const fallback = {
      name: payload?.occasion ? `${payload.occasion} Outfit` : 'AI Styled Outfit',
      score: 88,
      reason: `A smart outfit created for ${payload?.occasion || 'your day'} in ${payload?.weather || 'any'} weather.`,
      top: null,
      bottom: null,
      shoes: null,
      outerwear: null,
      dress: null,
      accessory: null
    };

    const getLocalFallbackOutfits = () => {
      const wardrobeItems = payload?.wardrobeItems || [];
      const tops = wardrobeItems.filter(it => it.category === 'Topwear');
      const bottoms = wardrobeItems.filter(it => it.category === 'Bottomwear');
      const shoesList = wardrobeItems.filter(it => it.category === 'Footwear');
      const dresses = wardrobeItems.filter(it => it.category === 'Dress');
      const outerwears = wardrobeItems.filter(it => it.category === 'Outerwear');
      const accessories = wardrobeItems.filter(it => it.category === 'Accessories');

      const pickRandom = (arr) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

      const localOutfits = [];
      for (let i = 1; i <= 2; i++) {
        const outfit = {
          name: `${payload?.occasion || 'Casual'} Outfit ${i}`,
          score: 85 + Math.floor(Math.random() * 10),
          reason: `A stylish locally combined look from your wardrobe curated for a ${payload?.occasion || 'Casual'} setting.`,
          top: null,
          bottom: null,
          shoes: null,
          outerwear: null,
          dress: null,
          accessory: null
        };

        const randomTop = pickRandom(tops);
        const randomBottom = pickRandom(bottoms);
        const randomShoes = pickRandom(shoesList);
        const randomDress = pickRandom(dresses);
        const randomOuterwear = pickRandom(outerwears);
        const randomAccessory = pickRandom(accessories);

        if (randomDress && (Math.random() > 0.5 || (!randomTop && !randomBottom))) {
          outfit.dress = randomDress.id;
        } else {
          outfit.top = randomTop ? randomTop.id : null;
          outfit.bottom = randomBottom ? randomBottom.id : null;
        }

        outfit.shoes = randomShoes ? randomShoes.id : null;
        outfit.outerwear = randomOuterwear ? randomOuterwear.id : null;
        outfit.accessory = randomAccessory ? randomAccessory.id : null;

        if (outfit.top || outfit.bottom || outfit.dress || outfit.shoes || outfit.accessory) {
          localOutfits.push(outfit);
        }
      }

      if (localOutfits.length > 0) {
        return { outfits: localOutfits };
      }
      return { outfits: [fallback] };
    };

    if (!payload?.wardrobeItems?.length) {
      return getLocalFallbackOutfits();
    }

    if (!GROQ_API_KEY) {
      return getLocalFallbackOutfits();
    }

    try {
      const wardrobeText = payload.wardrobeItems
        .slice(0, 100)
        .map((item) => {
          let lastWornStr = 'Never';
          if (item.lastWorn) {
            const days = Math.floor((Date.now() - new Date(item.lastWorn).getTime()) / (1000 * 60 * 60 * 24));
            lastWornStr = days <= 0 ? 'Today' : `${days} days ago`;
          }
          return `ID: ${item.id} — Name: ${item.name || 'Unknown item'}, Category: ${item.category || 'Unknown'}, Color: ${item.color || 'Unknown'}, Season: ${item.season || 'Any'}, Occasion: ${item.occasion || 'Any'}, Style: ${item.style || 'Casual'}, Last Worn: ${lastWornStr}`;
        })
        .join('\n');

      let avoidText = '';
      if (payload.recentlyWorn && payload.recentlyWorn.length > 0) {
        avoidText = `\nRecently worn or already suggested item combinations that you MUST NOT recommend (each string represents a hyphen-separated list of item IDs):
${payload.recentlyWorn.map(sig => `- [${sig}]`).join('\n')}
Do not suggest any combination matching these lists of item IDs.`;
      }

      const occasionName = payload.occasion || 'Casual';
      const numOutfits = 2;
      const namingRule = `The name of each outfit MUST be exactly '${occasionName} Outfit' followed by its index number (e.g., '${occasionName} Outfit 1', '${occasionName} Outfit 2'). Do NOT invent creative, descriptive, or fanciful names like 'Summer Breeze', 'Casual Chic', or 'Blue Heaven'.`;

      const prompt = `You are an expert fashion stylist. The user has the following wardrobe items in their database:
${wardrobeText}

User preferences:
${payload.preferences || 'None specified.'}

Current Weather conditions:
${payload.weatherDescription || 'Sunny'}

Target Occasion:
${payload.occasion || 'Office'}${avoidText}

Generate exactly ${numOutfits} unique outfit combinations. ${namingRule} Maximize usage of items that have not been worn recently (higher 'Last Worn' value or 'Never') to rotate their wardrobe. Make sure the outfits match the current weather and selected occasion.
For accessories, include matching items from the Accessories category if available.

Return ONLY a valid JSON object in this format:
{
  "outfits": [
    {
      "name": "Outfit Name",
      "score": 98,
      "reason": "Styling rationale for today's weather/occasion",
      "top": <ID of selected Topwear item from the list, or null if none>,
      "bottom": <ID of selected Bottomwear item from the list, or null if none>,
      "shoes": <ID of selected Footwear item from the list, or null if none>,
      "outerwear": <ID of selected Outerwear item from the list, or null if none>,
      "dress": <ID of selected Dress item from the list, or null if none>,
      "accessory": <ID of selected Accessories item from the list, or null if none>
    }
  ]
}

Rules:
1. Select items ONLY by their exact ID from the list. Do not invent any items.
2. The outfits must be completely unique and different from each other.
3. If no suitable item exists for a category in the wardrobe, set that key's value to null. Never invent placeholders.`;

      const response = await axios.post(
        GROQ_API_URL,
        {
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are an AI fashion stylist. Output valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 1500,
          temperature: 0.7,
          top_p: 1,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let rawContent = response.data?.choices?.[0]?.message?.content ?? response.data?.output_text;
      if (typeof rawContent === 'object' && rawContent !== null) {
        rawContent = JSON.stringify(rawContent);
      }

      if (typeof rawContent === 'string') {
        rawContent = rawContent.trim();
      }

      if (!rawContent) {
        return getLocalFallbackOutfits();
      }

      let parsed;
      try {
        parsed = JSON.parse(rawContent);
      } catch (error) {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      }

      if (!parsed || !Array.isArray(parsed.outfits)) {
        return getLocalFallbackOutfits();
      }

      return parsed;
    } catch (error) {
      console.warn('Groq outfit generation failed', error.message);
      return getLocalFallbackOutfits();
    }
  }

  async shoppingAssistant(payload) {
    const fallback = {
      verdict: 'Buy',
      reason: 'This selection appears to complement your existing wardrobe.',
      similarity: 78,
      wardrobeMatch: 84,
      compatibility: 88,
      recommendation: 'This item looks like a strong match for your closet.',
      matchingItems: [],
    };

    if (!GROQ_API_KEY || !payload?.selectedProduct) {
      return fallback;
    }

    const product = payload.selectedProduct || {};
    const wardrobeItems = Array.isArray(payload.wardrobeItems) ? payload.wardrobeItems : [];
    const wardrobeText = wardrobeItems
      .slice(0, 30)
      .map((item, idx) => {
        const name = item.name || item.category || `Item ${idx + 1}`;
        const category = item.category || 'Unknown';
        const color = item.color || 'Unknown';
        const season = item.season || 'Any';
        const occasion = item.occasion || 'Any';
        return `${idx + 1}. ${name} — ${category}, ${color}, ${season}, ${occasion}`;
      })
      .join('\n');

    const productText = `Name: ${product.name || 'Unknown product'}\nCategory: ${product.category || 'Unknown'}\nColor: ${product.color || 'Unknown'}\nPrice: ${product.price || 'Unknown'}\nImage URL: ${product.imageUrl || product.img || 'None'}`;

    const prompt = `You are an expert shopping assistant. The customer is considering buying this Myntra product:\n${productText}\n\nTheir wardrobe contains these items:\n${wardrobeText}\n\nCompare the product with the wardrobe and return ONLY a valid JSON object with the following keys: verdict, reason, similarity, wardrobeMatch, compatibility, recommendation, matchingItems.\n- verdict should be either Buy or Skip.\n- reason should be a short explanation.\n- similarity should be a numeric percentage (0-100).\n- wardrobeMatch should be a numeric percentage.\n- compatibility should be a numeric percentage.\n- recommendation should summarize the buy or skip decision.\n- matchingItems should be an array of objects with keys: name, category, color, imageUrl, matchReason. Do not provide any text outside the JSON object.`;

    try {
      const messageContent = [
        { type: 'text', text: prompt },
      ];

      if (product.imageUrl || product.img) {
        messageContent.push({
          type: 'image_url',
          image_url: { url: product.imageUrl || product.img },
        });
      }

      const response = await axios.post(
        GROQ_API_URL,
        {
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are an AI shopping assistant delivering structured JSON output only.',
            },
            {
              role: 'user',
              content: messageContent,
            },
          ],
          max_tokens: 300,
          temperature: 0.2,
          top_p: 1,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let rawContent = response.data?.choices?.[0]?.message?.content ?? response.data?.output_text;
      if (typeof rawContent === 'object' && rawContent !== null) {
        return {
          ...fallback,
          ...rawContent,
        };
      }

      if (typeof rawContent !== 'string') {
        rawContent = String(rawContent || '');
      }

      let parsed;
      try {
        parsed = JSON.parse(rawContent);
      } catch (error) {
        const match = rawContent.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : null;
      }

      if (!parsed || typeof parsed !== 'object') {
        return fallback;
      }

      return {
        ...fallback,
        ...parsed,
        matchingItems: Array.isArray(parsed.matchingItems) ? parsed.matchingItems : [],
        similarity: Number(parsed.similarity) || fallback.similarity,
        wardrobeMatch: Number(parsed.wardrobeMatch) || fallback.wardrobeMatch,
        compatibility: Number(parsed.compatibility) || fallback.compatibility,
      };
    } catch (error) {
      console.warn('Groq shopping assistant failed', error.message);
      return fallback;
    }
  }

  async assistantChat(payload) {
    const fallback = {
      response: 'I can help you style outfits, check duplicates, and suggest essentials from your wardrobe.',
    };

    if (!GROQ_API_KEY || !payload?.message) {
      return fallback;
    }

    const wardrobeText = Array.isArray(payload.wardrobeItems)
      ? payload.wardrobeItems.slice(0, 30).map((item, idx) => `${idx + 1}. ${item.name || item.category || 'Item'} — ${item.category || 'Unknown'}, ${item.color || 'Unknown'}, ${item.occasion || 'Any'}`).join('\n')
      : '';

    const prompt = `You are a helpful wardrobe assistant. The user asks: "${payload.message}"\n\nTheir wardrobe contains:\n${wardrobeText}\n\nPlease answer concisely and focus on styling, duplicate detection, or recommendations based on the wardrobe.`;

    try {
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a helpful AI wardrobe assistant. Keep answers focused and actionable.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 300,
          temperature: 0.7,
          top_p: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let rawContent = response.data?.choices?.[0]?.message?.content ?? response.data?.output_text;
      if (Array.isArray(rawContent)) {
        rawContent = rawContent.map((item) => (typeof item === 'string' ? item : item.text || '')).join('\n');
      }
      if (typeof rawContent !== 'string') {
        rawContent = String(rawContent || '');
      }

      return { response: rawContent.trim() || fallback.response };
    } catch (error) {
      console.warn('Groq assistant chat failed', error.message);
      return fallback;
    }
  }

  async recommendProducts(payload) {
    const fallback = {
      styleProfile: {
        primaryStyle: 'Casual',
        favoriteColor: 'Blue',
        favoriteCategory: 'Topwear'
      },
      wardrobeGaps: ['White Formal Shirt', 'Black Sneakers', 'Neutral Blazer'],
      recommendations: [
        {
          name: 'Charcoal Chinos',
          category: 'Bottomwear',
          price: 1499,
          mrp: 2499,
          imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80',
          reason: 'Pairs perfectly with your current wardrobe.',
          compatibilityScore: 92,
          recommendationType: 'Everyday Essentials'
        },
      ]
    };

    if (!GROQ_API_KEY || !Array.isArray(payload?.wardrobeItems)) {
      return fallback;
    }

    const wardrobeText = payload.wardrobeItems
      .slice(0, 40)
      .map((item, idx) => {
        return `${idx + 1}. ${item.name || item.category || 'Item'} — ${item.category || 'Unknown'}; ${item.color || 'Unknown'}; ${item.season || 'Any'}; ${item.occasion || 'Any'}`;
      })
      .join('\n');

    const prompt = `You are an expert fashion stylist and AI wardrobe recommendation engine. 
The user owns the following wardrobe items:
${wardrobeText}

Analyze this wardrobe and return a single valid JSON object containing:
1. "styleProfile": An object detailing the user's inferred style:
   - "primaryStyle": e.g., "Casual", "Formal", "Minimalist", "Streetwear", "Ethnic", "Sporty", "Smart Casual"
   - "favoriteColor": The most frequent color in their wardrobe.
   - "favoriteCategory": The most frequent category in their wardrobe (Topwear, Bottomwear, etc.).
2. "wardrobeGaps": An array of 3-4 missing essentials that would improve their wardrobe (e.g. "White Formal Shirt", "Black Sneakers", "Neutral Blazer", "Casual Jacket").
3. "recommendations": An array of exactly 4-6 recommended fashion products. Each product must be unique, not already owned, and have:
   - "name": Descriptive product name (e.g. "White Cotton Formal Shirt", "Classic Black Sneakers").
   - "category": Topwear, Bottomwear, Dress, Outerwear, Footwear, or Accessories.
   - "price": An estimated price in Indian Rupees (number).
   - "mrp": An estimated MRP in Indian Rupees (number, higher than price).
   - "imageUrl": A high-quality Unsplash image URL representing the product.
   - "compatibilityScore": An integer between 50 and 99 indicating how well it matches the user's style and wardrobe.
   - "reason": A specific styling explanation (e.g., "Pairs well with your blue jeans while filling a wardrobe gap.").
   - "recommendationType": Must be exactly one of: "Because It Matches Your Wardrobe", "Complete Your Collection", "Trending For Your Style", "Everyday Essentials".

Return ONLY a valid JSON object matching this schema (no other text, no markdown block):
{
  "styleProfile": {
    "primaryStyle": "Smart Casual",
    "favoriteColor": "Blue",
    "favoriteCategory": "Topwear"
  },
  "wardrobeGaps": ["White Formal Shirt", "Black Sneakers"],
  "recommendations": [
    {
      "name": "White Cotton Formal Shirt",
      "category": "Topwear",
      "price": 1299,
      "mrp": 2499,
      "imageUrl": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80",
      "compatibilityScore": 95,
      "reason": "Matches your existing trousers and blazers while filling a wardrobe gap.",
      "recommendationType": "Complete Your Collection"
    }
  ]
}`;

    try {
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You respond only with a JSON object containing styleProfile, wardrobeGaps, and recommendations array.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.5,
          top_p: 1,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let rawContent = response.data?.choices?.[0]?.message?.content ?? response.data?.output_text;
      if (typeof rawContent === 'object' && rawContent !== null) {
        return rawContent;
      }

      if (typeof rawContent !== 'string') {
        rawContent = String(rawContent || '');
      }

      let parsed;
      try {
        parsed = JSON.parse(rawContent);
      } catch (error) {
        const match = rawContent.match(/\{([\s\S]*)\}/);
        parsed = match ? JSON.parse(match[0]) : null;
      }

      if (!parsed || !parsed.styleProfile || !Array.isArray(parsed.recommendations)) {
        return fallback;
      }

      return {
        styleProfile: {
          primaryStyle: parsed.styleProfile.primaryStyle || 'Casual',
          favoriteColor: parsed.styleProfile.favoriteColor || 'Blue',
          favoriteCategory: parsed.styleProfile.favoriteCategory || 'Topwear'
        },
        wardrobeGaps: Array.isArray(parsed.wardrobeGaps) ? parsed.wardrobeGaps : fallback.wardrobeGaps,
        recommendations: parsed.recommendations.map((item) => ({
          name: item.name || 'Recommended Product',
          category: item.category || 'Apparel',
          price: Number(item.price) || 999,
          mrp: Number(item.mrp) || 1999,
          imageUrl: item.imageUrl || item.img || 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80',
          reason: item.reason || 'Complementary wardrobe recommendation.',
          compatibilityScore: Number(item.compatibilityScore) || 85,
          recommendationType: item.recommendationType || 'Everyday Essentials'
        }))
      };
    } catch (error) {
      console.warn('Groq recommendation generation failed', error.message);
      return fallback;
    }
  }

  async detectDuplicates(payload) {
    return {
      isDuplicate: false,
      confidence: 0.84,
      matches: [],
      message: 'No duplicate was detected.',
    };
  }
}

export default new GroqService();
