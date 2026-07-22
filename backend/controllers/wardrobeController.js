import WardrobeService from '../services/WardrobeService.js';
import UploadService from '../services/UploadService.js';
import GroqService from '../services/GroqService.js';

/**
 * Normalize a string: trim whitespace and convert to title case
 */
function normalizeString(value) {
  if (!value || typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Validate analysis result and return clean payload for DB insertion
 */
function prepareWardrobePayload(analysis, req) {
  const isFullyUnknown =
    analysis.category === 'Unknown' &&
    analysis.confidence === 0 &&
    String(analysis.item_name || '').toLowerCase() === 'unknown';

  if (isFullyUnknown) {
    const fallbackFile = req.file || { originalname: req.body.name || 'clothing item' };
    const fallback = GroqService.buildFilenameFallbackAnalysis(fallbackFile, req.body.name || 'clothing item');

    return {
      name: '[Unidentified] ' + (fallback.item_name || 'Item'),
      category: fallback.category || 'Unknown',
      color: fallback.color || 'Black',
      occasion: fallback.occasion || 'Casual',
      season: fallback.season || 'All Season',
      brand: req.body.brand || '',
      notes: '[NEEDS REVIEW] AI could not identify this item. Please review and recategorize manually.',
      pattern: fallback.pattern || 'Solid',
      aiTags: ['Unidentified'],
      favorite: req.body.favorite === 'true' || req.body.favorite === true,
    };
  }

  let category = normalizeString(analysis.category) || 'Unknown';

  return {
    name: normalizeString(analysis.item_name) || normalizeString(req.body.name) || 'Wardrobe Item',
    category,
    color: normalizeString(analysis.color) || 'Black',
    occasion: normalizeString(analysis.occasion) || 'Casual',
    season: normalizeString(analysis.season) || 'All Season',
    brand: normalizeString(req.body.brand) || '',
    notes: normalizeString(req.body.notes) || '',
    pattern: normalizeString(analysis.pattern) || 'Solid',
    aiTags: Array.isArray(analysis.aiTags) ? analysis.aiTags.map(t => normalizeString(t)).filter(Boolean) : ['AI Tagged'],
    favorite: req.body.favorite === 'true' || req.body.favorite === true,
  };
}

export async function listWardrobe(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    let { q, category, color, occasion, season, page, limit } = req.query;

    if (category) {
      if (category === 'Top') category = 'Topwear';
      else if (category === 'Bottom') category = 'Bottomwear';
      else if (category === 'Dress') category = 'Dress';
      else if (category === 'Outerwear') category = 'Outerwear';
      else if (category === 'Shoes') category = 'Footwear';
      else if (category === 'Accessory') category = 'Accessories';
    }

    if (season) {
      if (season === 'All') season = 'All Season';
    }

    if (occasion) {
      if (occasion === 'Sportswear') occasion = 'Sports';
    }

    const items = await WardrobeService.list(userId, { q, category, color, occasion, season, page, limit });

    if (page || limit) {
      const total = await WardrobeService.count(userId, { q, category, color, occasion, season });
      const p = parseInt(page || 1, 10);
      const l = parseInt(limit || 8, 10);
      return res.json({
        items,
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
      });
    }

    res.json(items);
  } catch (error) {
    next(error);
  }
}

export async function getWardrobeById(req, res, next) {
  try {
    const item = await WardrobeService.getById(req.user?.sub || 1, req.params.id);
    res.json(item);
  } catch (error) {
    next(error);
  }
}

export async function createWardrobe(req, res, next) {
  try {
    const upload = await UploadService.save(req.file);
    const analysis = await GroqService.analyzeWardrobeImage(
      req.file || { buffer: Buffer.from(''), originalname: req.body.name || 'clothing item' },
      req.body.name || 'clothing item'
    );

    // Log normalized analysis after GroqService validate & normalize (raw logged in GroqService)
    console.log('[WardrobeController] Normalized analysis for save:', JSON.stringify(analysis));

    const itemPayload = prepareWardrobePayload(analysis, req);
    let notes = normalizeString(req.body.notes) || '';

    // Add confidence note if confidence is low
    if (analysis.confidence !== undefined && Number(analysis.confidence) > 0 && Number(analysis.confidence) < 50) {
      itemPayload.name = `[Review Required] ${itemPayload.name}`;
      notes = `[NEEDS REVIEW: Low AI confidence score of ${analysis.confidence}%] ${notes}`.trim();
    }

    const payload = {
      userId: req.user?.sub || 1,
      imageUrl: upload.url || req.body.imageUrl || '',
      category: itemPayload.category,
      color: itemPayload.color,
      occasion: itemPayload.occasion,
      season: itemPayload.season,
      brand: itemPayload.brand,
      notes: notes || itemPayload.notes,
      name: itemPayload.name,
      pattern: itemPayload.pattern,
      aiTags: itemPayload.aiTags,
      favorite: itemPayload.favorite,
    };

    const wardrobe = await WardrobeService.create(payload.userId, payload);
    res.status(201).json({ wardrobe, upload, analysis, item: payload });
  } catch (error) {
    next(error);
  }
}

export async function updateWardrobe(req, res, next) {
  try {
    const payload = {
      imageUrl: req.body.imageUrl || '',
      category: req.body.category || '',
      color: req.body.color || '',
      occasion: req.body.occasion || '',
      season: req.body.season || '',
      brand: req.body.brand || '',
      notes: req.body.notes || '',
      name: req.body.name || '',
      pattern: req.body.pattern || '',
      aiTags: req.body.aiTags || [],
      favorite: req.body.favorite === 'true' || req.body.favorite === true,
    };
    const result = await WardrobeService.update(req.user?.sub || 1, req.params.id, payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteWardrobe(req, res, next) {
  try {
    const result = await WardrobeService.remove(req.user?.sub || 1, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createWardrobeDirect(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    const { name, category, color, occasion, season, brand, notes, pattern, imageUrl, favorite } = req.body;

    const payload = {
      userId,
      imageUrl: imageUrl || '',
      category: category || 'Topwear',
      color: color || 'Black',
      occasion: occasion || 'Casual',
      season: season || 'All Season',
      brand: brand || '',
      notes: notes || '',
      name: name || 'Wardrobe Item',
      pattern: pattern || 'Solid',
      aiTags: [category || 'Custom'],
      favorite: favorite === 'true' || favorite === true,
    };

    const wardrobe = await WardrobeService.create(userId, payload);
    res.status(201).json({ wardrobe, item: payload });
  } catch (error) {
    next(error);
  }
}
