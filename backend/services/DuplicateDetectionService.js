import WardrobeService from './WardrobeService.js';
import axios from 'axios';
import { createConnection } from '../config/oracle.js';

const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const normalize = (value = '') => String(value || '').trim().toLowerCase();
const extractWords = (value = '') =>
  normalize(value)
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);

function computeSimilarity(product, item) {
  if (product.name && item.name && normalize(product.name) === normalize(item.name)) {
    return 100;
  }
  const normProdCat = normalize(product.category);
  const normItemCat = normalize(item.category);
  
  // If categories are different, they are different products (max 15% similarity)
  if (normProdCat !== normItemCat) {
    return 10;
  }

  const prodColor = normalize(product.color);
  const itemColor = normalize(item.color);
  const prodOccasion = normalize(product.occasion || 'casual');
  const itemOccasion = normalize(item.occasion || 'casual');
  
  const colorMatch = prodColor && prodColor === itemColor;
  const occasionMatch = prodOccasion && prodOccasion === itemOccasion;

  const productWords = extractWords(product.name || '');
  const itemWords = extractWords(item.name || '');
  const sharedWords = productWords.filter((word) => itemWords.includes(word));

  const fashionKeywords = ['shirt', 't-shirt', 'tee', 'jeans', 'pant', 'trouser', 'chino', 'shorts', 'skirt', 'shoe', 'sneaker', 'sandal', 'boot', 'jacket', 'coat', 'sweater', 'hoodie', 'dress', 'saree', 'kurta', 'socks', 'watch', 'belt', 'bag'];
  const prodKeywords = productWords.filter(w => fashionKeywords.includes(w));
  const itemKeywords = itemWords.filter(w => fashionKeywords.includes(w));

  let isSameProduct = false;
  if (sharedWords.length > 0) {
    isSameProduct = true;
  } else {
    const sharedKeywords = prodKeywords.filter(w => itemKeywords.includes(w));
    if (sharedKeywords.length > 0) {
      isSameProduct = true;
    }
  }

  // High Risk or Duplicate (similarity >= 70) only when color, category, occasion match and they are same product type
  if (colorMatch && occasionMatch && isSameProduct) {
    let score = 75;
    if (sharedWords.length > 1) {
      score = Math.min(100, 75 + sharedWords.length * 5);
    }
    return score;
  }

  // Base score calculation for matching category + other features
  let score = 20; // base for matching category
  if (colorMatch) score += 20;
  if (occasionMatch) score += 10;
  if (normalize(product.pattern) && normalize(product.pattern) === normalize(item.pattern)) {
    score += 10;
  }
  if (normalize(product.brand) && normalize(product.brand) === normalize(item.brand)) {
    score += 10;
  }
  if (isSameProduct) {
    score += 15;
  }

  // If they are not the same type of product, cap similarity below High Risk (max 55%)
  if (!isSameProduct) {
    score = Math.min(55, score);
  }

  return Math.min(95, score);
}

function getRecommendation(similarity) {
  if (similarity >= 90) return "Avoid Purchase";
  if (similarity >= 70) return "Consider Before Buying";
  if (similarity >= 40) return "Somewhat Similar";
  return "Safe to Purchase";
}

function getDuplicateStatus(similarity) {
  if (similarity >= 90) return "Duplicate Purchase";
  if (similarity >= 70) return "Very Similar";
  if (similarity >= 40) return "Somewhat Similar";
  return "Unique Addition";
}

class DuplicateDetectionService {
  async detectDuplicates(userId, payload) {
    let selectedProduct = payload?.selectedProduct || payload?.product || {};
    const productId = payload?.productId;

    if (productId && (!selectedProduct || !selectedProduct.name)) {
      const connection = await createConnection();
      try {
        const result = await connection.execute(
          `SELECT name, category, price, mrp, image_url, reason 
           FROM recommendations 
           WHERE recommendation_id = :productId`,
          { productId }
        );
        if (result.rows && result.rows.length > 0) {
          const row = result.rows[0];
          selectedProduct = {
            name: row.NAME ?? row.name,
            category: row.CATEGORY ?? row.category,
            price: row.PRICE ?? row.price,
            mrp: row.MRP ?? row.mrp,
            imageUrl: row.IMAGE_URL ?? row.image_url,
            reason: row.REASON ?? row.reason,
          };
        }
      } catch (dbErr) {
        console.warn('[DuplicateDetectionService] DB fetch failed:', dbErr.message);
      } finally {
        await connection.close();
      }
    }

    const wardrobeItems = await WardrobeService.list(userId);

    const targetCat = normalize(selectedProduct.category || '');
    const filteredWardrobe = wardrobeItems.filter(item => {
      const itemCat = normalize(item.category || '');
      return itemCat === targetCat || itemCat.includes(targetCat) || targetCat.includes(itemCat) || wardrobeItems.length <= 40;
    });

    const matches = wardrobeItems
      .map((item) => {
        const similarity = computeSimilarity(selectedProduct, item);
        return {
          name: item.name || item.category || 'Wardrobe item',
          category: item.category,
          color: item.color,
          imageUrl: item.imageUrl,
          similarity,
          recommendation: getRecommendation(similarity),
        };
      })
      .sort((a, b) => b.similarity - a.similarity);

    const fallbackMatch = matches[0] || null;
    const fallbackSimilarity = fallbackMatch ? fallbackMatch.similarity : 0;
    const fallbackRecommendation = getRecommendation(fallbackSimilarity);
    const fallbackStatus = getDuplicateStatus(fallbackSimilarity);

    const fallbackResult = {
      duplicate: fallbackSimilarity >= 90,
      similarity: fallbackSimilarity,
      existingItem: fallbackMatch ? fallbackMatch.name : "None",
      recommendation: fallbackRecommendation,
      status: fallbackStatus,
      reason: fallbackSimilarity >= 90
        ? `You already own a highly similar item: ${fallbackMatch.name} (${fallbackSimilarity}% similarity).`
        : `This product is a unique addition (${fallbackSimilarity}% similarity) to your wardrobe.`,
      topMatch: fallbackMatch,
      matches: matches.slice(0, 3)
    };

    if (!GROQ_API_KEY) {
      return fallbackResult;
    }

    try {
      const wardrobeText = filteredWardrobe.map((item, idx) => 
        `[Item ${idx + 1}] Name: "${item.name}", Category: "${item.category}", Color: "${item.color}", Pattern: "${item.pattern || 'Solid'}", Occasion: "${item.occasion || 'Casual'}"`
      ).join('\n');

      const prompt = `You are a fashion expert. Compare the selected product with the user's existing wardrobe items to identify if there is a duplicate or a very similar item.

Selected Product:
Name: "${selectedProduct.name}"
Category: "${selectedProduct.category}"
Color: "${selectedProduct.color || 'Unknown'}"
Pattern: "${selectedProduct.pattern || 'Solid'}"
Occasion: "${selectedProduct.occasion || 'Casual'}"

Existing Wardrobe:
${wardrobeText || 'None'}

Compare the selected product against all items. Identify the closest matching item.
Assign a similarity percentage (0-100) based on category, color, pattern, style, and occasion.
Use these rules:
- Similarity >= 90: Duplicate Purchase (Recommendation: "Avoid Purchase")
- Similarity 70-89: Very Similar (Recommendation: "Consider Before Buying")
- Similarity 40-69: Somewhat Similar (Recommendation: "Somewhat Similar")
- Similarity < 40: Unique Addition (Recommendation: "Safe to Purchase")

Return ONLY a valid JSON object in this format:
{
  "duplicate": true/false,
  "similarity": 93,
  "existingItem": "Name of closest matching wardrobe item",
  "recommendation": "Avoid Purchase" | "Consider Before Buying" | "Somewhat Similar" | "Safe to Purchase",
  "reason": "Explain why it is a duplicate or a safe purchase in detail."
}`;

      const response = await axios.post(
        GROQ_API_URL,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a wardrobe analyzer. Output only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const data = JSON.parse(response.data?.choices?.[0]?.message?.content.trim());
      const similarity = Number(data.similarity) || fallbackSimilarity;
      const recommendation = getRecommendation(similarity);
      const status = getDuplicateStatus(similarity);

      const topMatchItem = wardrobeItems.find(item => 
        normalize(item.name) === normalize(data.existingItem) || 
        (fallbackMatch && normalize(item.name) === normalize(fallbackMatch.name))
      ) || fallbackMatch;

      return {
        duplicate: similarity >= 90,
        similarity,
        existingItem: data.existingItem || (fallbackMatch ? fallbackMatch.name : "None"),
        recommendation,
        status,
        reason: data.reason || fallbackResult.reason,
        topMatch: topMatchItem ? {
          name: topMatchItem.name,
          category: topMatchItem.category,
          color: topMatchItem.color,
          imageUrl: topMatchItem.imageUrl,
          similarity
        } : null,
        matches: matches.slice(0, 3)
      };
    } catch (err) {
      console.error('[DuplicateDetectionService] Groq AI analysis failed, falling back:', err.message);
      return fallbackResult;
    }
  }
}

export default new DuplicateDetectionService();
