import { createConnection } from '../config/oracle.js';
import oracledb from 'oracledb';
import GroqService from './GroqService.js';

const fallbackItems = [];
let fallbackIdSeed = 4;

function parseAiTags(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value)
    .split(/[|,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeItem(row) {
  if (!row) return null;
  return {
    id: row.ID ?? row.id ?? row._id,
    userId: row.USER_ID ?? row.userId,
    name: row.NAME ?? row.name,
    imageUrl: row.IMAGE_URL ?? row.imageUrl,
    category: row.CATEGORY ?? row.category,
    color: row.COLOR ?? row.color,
    occasion: row.OCCASION ?? row.occasion,
    season: row.SEASON ?? row.season,
    brand: row.BRAND ?? row.brand,
    notes: row.NOTES ?? row.notes,
    pattern: row.PATTERN ?? row.pattern,
    aiTags: parseAiTags(row.AI_TAGS ?? row.aiTags),
    favorite: Boolean(row.FAVORITE ?? row.favorite),
    lastWorn: row.LAST_WORN ?? row.lastWorn,
    createdAt: row.CREATED_AT ?? row.createdAt,
    updatedAt: row.UPDATED_AT ?? row.updatedAt,
  };
}

function toFallbackItem(userId, payload) {
  const item = {
    id: fallbackIdSeed++,
    userId,
    name: payload.name || 'Wardrobe Item',
    imageUrl: payload.imageUrl || '',
    category: payload.category || '',
    color: payload.color || '',
    occasion: payload.occasion || '',
    season: payload.season || '',
    brand: payload.brand || '',
    notes: payload.notes || '',
    pattern: payload.pattern || '',
    aiTags: parseAiTags(payload.aiTags),
    favorite: Boolean(payload.favorite),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  fallbackItems.push(item);
  return item;
}

function getFallbackItems(userId) {
  return fallbackItems.filter((item) => item.userId === userId || item.userId === undefined || item.userId === null);
}

class WardrobeService {
  async list(userId, options = {}) {
    const { q, category, color, occasion, season, page, limit } = options;
    try {
      const connection = await createConnection();
      try {
        let sql = `SELECT id, user_id, name, image_url, category, color, occasion, season, brand, pattern, ai_tags, TO_CHAR(notes) AS notes, favorite, last_worn, created_at, updated_at
                   FROM wardrobe_items WHERE (user_id IS NULL OR user_id = :userId)`;
        const binds = { userId };

        if (q) {
          const parsed = await GroqService.understandSearchQuery(q);
          
          if (parsed.category) {
            sql += ` AND LOWER(TRIM(category)) = LOWER(TRIM(:qCategory))`;
            binds.qCategory = parsed.category;
          }
          
          if (parsed.color) {
            sql += ` AND (LOWER(TRIM(color)) = LOWER(TRIM(:qColor)) OR LOWER(TRIM(name)) LIKE :qColorLike OR LOWER(TRIM(notes)) LIKE :qColorLike)`;
            binds.qColor = parsed.color;
            binds.qColorLike = `%${parsed.color.toLowerCase()}%`;
          }
          
          if (parsed.keywords && parsed.keywords.length > 0) {
            const kwParts = [];
            parsed.keywords.forEach((keyword, idx) => {
              const paramName = `kw${idx}`;
              kwParts.push(`LOWER(TRIM(name)) LIKE :${paramName} OR LOWER(TRIM(notes)) LIKE :${paramName} OR LOWER(TRIM(brand)) LIKE :${paramName} OR LOWER(TRIM(color)) LIKE :${paramName}`);
              binds[paramName] = `%${keyword.toLowerCase()}%`;
            });
            if (kwParts.length > 0) {
              sql += ` AND (${kwParts.join(' OR ')})`;
            }
          }
        }
        if (category) {
          sql += ` AND LOWER(TRIM(category)) = LOWER(TRIM(:category))`;
          binds.category = category;
        }
        if (color) {
          sql += ` AND LOWER(TRIM(color)) LIKE LOWER(TRIM(:color))`;
          binds.color = `%${color.toLowerCase()}%`;
        }
        if (occasion) {
          sql += ` AND LOWER(TRIM(occasion)) LIKE LOWER(TRIM(:occasion))`;
          binds.occasion = `%${occasion.toLowerCase()}%`;
        }
        if (season) {
          sql += ` AND LOWER(TRIM(season)) LIKE LOWER(TRIM(:season))`;
          binds.season = `%${season.toLowerCase()}%`;
        }

        sql += ` ORDER BY created_at DESC`;

        if (page && limit) {
          const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
          sql += ` OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
          binds.offset = offset;
          binds.limit = parseInt(limit, 10);
        }

        const result = await connection.execute(sql, binds);
        return result.rows.map(normalizeItem);
      } finally {
        await connection.close();
      }
    } catch (error) {
      console.warn('Oracle unavailable, serving wardrobe items from fallback store.', error.message);
      let items = getFallbackItems(userId).map(normalizeItem);
      if (q) {
        const parsed = await GroqService.understandSearchQuery(q);
        items = items.filter((it) => {
          const itemCat = (it.category || '').toLowerCase();
          const itemColor = (it.color || '').toLowerCase();
          const itemName = (it.name || '').toLowerCase();
          const itemNotes = (it.notes || '').toLowerCase();
          const itemBrand = (it.brand || '').toLowerCase();

          let match = false;
          if (parsed.category && itemCat === parsed.category.toLowerCase()) {
            match = true;
          }
          if (parsed.color && itemColor.includes(parsed.color.toLowerCase())) {
            match = true;
          }
          if (parsed.keywords && parsed.keywords.length > 0) {
            for (const kw of parsed.keywords) {
              const kwLower = kw.toLowerCase();
              if (itemName.includes(kwLower) || itemNotes.includes(kwLower) || itemBrand.includes(kwLower)) {
                match = true;
                break;
              }
            }
          }
          return match;
        });
      }
      if (category) {
        items = items.filter((it) => (it.category || '').toLowerCase() === category.toLowerCase());
      }
      if (color) {
        items = items.filter((it) => (it.color || '').toLowerCase().includes(color.toLowerCase()));
      }
      if (occasion) {
        items = items.filter((it) => (it.occasion || '').toLowerCase().includes(occasion.toLowerCase()));
      }
      if (season) {
        items = items.filter((it) => (it.season || '').toLowerCase().includes(season.toLowerCase()));
      }
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      if (page && limit) {
        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        items = items.slice(offset, offset + parseInt(limit, 10));
      }
      return items;
    }
  }

  async count(userId, options = {}) {
    const { q, category, color, occasion, season } = options;
    try {
      const connection = await createConnection();
      try {
        let sql = `SELECT COUNT(*) AS total FROM wardrobe_items WHERE (user_id IS NULL OR user_id = :userId)`;
        const binds = { userId };

        if (q) {
          const parsed = await GroqService.understandSearchQuery(q);
          const qParts = [];
          if (parsed.category) {
            qParts.push(`LOWER(TRIM(category)) = LOWER(TRIM(:qCategory))`);
            binds.qCategory = parsed.category;
          }
          if (parsed.color) {
            qParts.push(`LOWER(TRIM(color)) LIKE LOWER(TRIM(:qColor))`);
            binds.qColor = `%${parsed.color.toLowerCase()}%`;
          }
          if (parsed.keywords && parsed.keywords.length > 0) {
            parsed.keywords.forEach((keyword, idx) => {
              const paramName = `kw${idx}`;
              qParts.push(`LOWER(TRIM(name)) LIKE :${paramName} OR LOWER(TRIM(notes)) LIKE :${paramName} OR LOWER(TRIM(brand)) LIKE :${paramName}`);
              binds[paramName] = `%${keyword.toLowerCase()}%`;
            });
          }
          if (qParts.length > 0) {
            sql += ` AND (${qParts.join(' OR ')})`;
          }
        }
        if (category) {
          sql += ` AND LOWER(TRIM(category)) = LOWER(TRIM(:category))`;
          binds.category = category;
        }
        if (color) {
          sql += ` AND LOWER(TRIM(color)) LIKE LOWER(TRIM(:color))`;
          binds.color = `%${color.toLowerCase()}%`;
        }
        if (occasion) {
          sql += ` AND LOWER(TRIM(occasion)) LIKE LOWER(TRIM(:occasion))`;
          binds.occasion = `%${occasion.toLowerCase()}%`;
        }
        if (season) {
          sql += ` AND LOWER(TRIM(season)) LIKE LOWER(TRIM(:season))`;
          binds.season = `%${season.toLowerCase()}%`;
        }

        const result = await connection.execute(sql, binds);
        const firstRow = result.rows[0];
        return Number(firstRow?.TOTAL ?? firstRow?.total ?? 0);
      } finally {
        await connection.close();
      }
    } catch (error) {
      console.warn('Oracle unavailable, counting wardrobe items from fallback store.', error.message);
      let items = getFallbackItems(userId);
      if (q) {
        const parsed = await GroqService.understandSearchQuery(q);
        items = items.filter((it) => {
          const itemCat = (it.category || '').toLowerCase();
          const itemColor = (it.color || '').toLowerCase();
          const itemName = (it.name || '').toLowerCase();
          const itemNotes = (it.notes || '').toLowerCase();
          const itemBrand = (it.brand || '').toLowerCase();

          let match = false;
          if (parsed.category && itemCat === parsed.category.toLowerCase()) {
            match = true;
          }
          if (parsed.color && itemColor.includes(parsed.color.toLowerCase())) {
            match = true;
          }
          if (parsed.keywords && parsed.keywords.length > 0) {
            for (const kw of parsed.keywords) {
              const kwLower = kw.toLowerCase();
              if (itemName.includes(kwLower) || itemNotes.includes(kwLower) || itemBrand.includes(kwLower)) {
                match = true;
                break;
              }
            }
          }
          return match;
        });
      }
      if (category) {
        items = items.filter((it) => (it.category || '').toLowerCase() === category.toLowerCase());
      }
      if (color) {
        items = items.filter((it) => (it.color || '').toLowerCase().includes(color.toLowerCase()));
      }
      if (occasion) {
        items = items.filter((it) => (it.occasion || '').toLowerCase().includes(occasion.toLowerCase()));
      }
      if (season) {
        items = items.filter((it) => (it.season || '').toLowerCase().includes(season.toLowerCase()));
      }
      return items.length;
    }
  }

  async create(userId, payload) {
    try {
      const connection = await createConnection();
      try {
        const result = await connection.execute(
          `INSERT INTO wardrobe_items (user_id, name, image_url, category, color, occasion, season, brand, pattern, ai_tags, notes, favorite)
           VALUES (:userId, :name, :imageUrl, :category, :color, :occasion, :season, :brand, :pattern, :aiTags, :notes, :favorite)
           RETURNING id INTO :itemId`,
          {
            userId,
            name: payload.name,
            imageUrl: payload.imageUrl,
            category: payload.category,
            color: payload.color,
            occasion: payload.occasion,
            season: payload.season,
            brand: payload.brand,
            pattern: payload.pattern,
            aiTags: Array.isArray(payload.aiTags) ? payload.aiTags.join('|') : payload.aiTags,
            notes: payload.notes,
            favorite: payload.favorite ? 1 : 0,
            itemId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          }
        );
        // Personalization: Clear recommendation cache on wardrobe updates
        await connection.execute(`DELETE FROM recommendations WHERE user_id = :userId`, { userId });
        await connection.commit();
        return { id: result.outBinds.itemId[0] };
      } finally {
        await connection.close();
      }
    } catch (error) {
      console.warn('Oracle unavailable, storing wardrobe item in fallback store.', error.message);
      return { id: toFallbackItem(userId, payload).id };
    }
  }

  async getById(userId, itemId) {
    try {
      const connection = await createConnection();
      try {
        const result = await connection.execute(
          `SELECT id, user_id, name, image_url, category, color, occasion, season, brand, pattern, ai_tags, TO_CHAR(notes) AS notes, favorite, last_worn, created_at, updated_at
           FROM wardrobe_items WHERE id = :itemId AND (user_id IS NULL OR user_id = :userId)`,
          { userId, itemId }
        );
        return normalizeItem(result.rows[0]);
      } finally {
        await connection.close();
      }
    } catch (error) {
      console.warn('Oracle unavailable, reading wardrobe item from fallback store.', error.message);
      return normalizeItem(getFallbackItems(userId).find((item) => String(item.id) === String(itemId)) || null);
    }
  }

  async update(userId, itemId, payload) {
    try {
      const connection = await createConnection();
      try {
        await connection.execute(
          `UPDATE wardrobe_items
           SET name = :name,
               image_url = :imageUrl,
               category = :category,
               color = :color,
               occasion = :occasion,
               season = :season,
               brand = :brand,
               pattern = :pattern,
               ai_tags = :aiTags,
               notes = :notes,
               favorite = :favorite,
               updated_at = SYSTIMESTAMP
           WHERE id = :itemId AND (user_id IS NULL OR user_id = :userId)`,
          {
            userId,
            itemId,
            name: payload.name,
            imageUrl: payload.imageUrl,
            category: payload.category,
            color: payload.color,
            occasion: payload.occasion,
            season: payload.season,
            brand: payload.brand,
            pattern: payload.pattern,
            aiTags: Array.isArray(payload.aiTags) ? payload.aiTags.join('|') : payload.aiTags,
            notes: payload.notes,
            favorite: payload.favorite ? 1 : 0,
          }
        );
        // Personalization: Clear recommendation cache on wardrobe updates
        await connection.execute(`DELETE FROM recommendations WHERE user_id = :userId`, { userId });
        await connection.commit();
        return { ok: true };
      } finally {
        await connection.close();
      }
    } catch (error) {
      console.warn('Oracle unavailable, updating wardrobe item in fallback store.', error.message);
      const target = getFallbackItems(userId).find((item) => String(item.id) === String(itemId));
      if (target) {
        Object.assign(target, {
          name: payload.name || target.name,
          imageUrl: payload.imageUrl || target.imageUrl,
          category: payload.category || target.category,
          color: payload.color || target.color,
          occasion: payload.occasion || target.occasion,
          season: payload.season || target.season,
          brand: payload.brand || target.brand,
          notes: payload.notes || target.notes,
          pattern: payload.pattern || target.pattern,
          aiTags: parseAiTags(payload.aiTags),
          favorite: payload.favorite ? 1 : 0,
          updatedAt: new Date().toISOString(),
        });
      }
      return { ok: true };
    }
  }

  async remove(userId, itemId) {
    try {
      const connection = await createConnection();
      try {
        await connection.execute(
          `DELETE FROM wardrobe_items WHERE id = :itemId AND (user_id IS NULL OR user_id = :userId)`,
          { userId, itemId }
        );
        // Personalization: Clear recommendation cache on wardrobe updates
        await connection.execute(`DELETE FROM recommendations WHERE user_id = :userId`, { userId });
        await connection.commit();
        return { ok: true };
      } finally {
        await connection.close();
      }
    } catch (error) {
      console.warn('Oracle unavailable, removing wardrobe item from fallback store.', error.message);
      const index = getFallbackItems(userId).findIndex((item) => String(item.id) === String(itemId));
      if (index >= 0) {
        fallbackItems.splice(index, 1);
      }
      return { ok: true };
    }
  }

  async markAsWorn(userId, itemIds) {
    if (!itemIds || itemIds.length === 0) return;
    try {
      const connection = await createConnection();
      try {
        for (const id of itemIds) {
          await connection.execute(
            `UPDATE wardrobe_items SET last_worn = SYSTIMESTAMP WHERE id = :id AND (user_id = :userId OR user_id IS NULL)`,
            { id, userId }
          );
        }
        await connection.commit();
      } finally {
        await connection.close();
      }
    } catch (error) {
      console.warn('Oracle unavailable, marking wardrobe items as worn in fallback store.', error.message);
      const fallbackStore = getFallbackItems(userId);
      for (const id of itemIds) {
        const item = fallbackStore.find((it) => String(it.id) === String(id));
        if (item) {
          item.lastWorn = new Date().toISOString();
        }
      }
    }
  }
}

export default new WardrobeService();
