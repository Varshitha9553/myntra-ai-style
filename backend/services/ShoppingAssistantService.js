import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

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

class ShoppingAssistantService {
  /**
   * Analyze product image using Groq Vision API
   */
  async analyzeProductImage(imageUrl, productName) {
    if (!GROQ_API_KEY || !imageUrl) {
      console.log('[ShoppingAssistantService] No API key or image URL, using text fallback');
      return this.guessDetailsFromText(productName);
    }

    try {
      let targetUrl = imageUrl;
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        console.log('[ShoppingAssistantService] Downloading local image for vision analysis:', imageUrl);
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 6000
        });
        const base64Data = Buffer.from(imageResponse.data, 'binary').toString('base64');
        const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
        targetUrl = `data:${contentType};base64,${base64Data}`;
      } else {
        console.log('[ShoppingAssistantService] Passing public image URL directly to Groq Vision:', imageUrl);
      }

      console.log('[ShoppingAssistantService] Analyzing image via Groq Vision...');
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: targetUrl },
                },
                {
                  type: 'text',
                  text: `Analyze this fashion product image. Identify the following details:
1. Category (Must be exactly one of: Topwear, Bottomwear, Dress, Outerwear, Footwear, Accessories)
2. Color (Identify the main dominant color)
3. Pattern (Must be exactly one of: Solid, Striped, Checked, Printed, Floral, Graphic, Polka Dot, Plain)
4. Season (Must be exactly one of: Summer, Winter, Spring, Autumn, All Season)
5. Occasion (Must be exactly one of: Casual, Formal, Office, Party, Wedding, Sports, Travel, Everyday)

Return ONLY a valid JSON object in this format (no other text, no markdown block):
{
  "category": "category name",
  "color": "color name",
  "pattern": "pattern name",
  "season": "season name",
  "occasion": "occasion name"
}`,
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

      const content = response.data?.choices?.[0]?.message?.content || '';
      const parsed = parseGroqJsonContent(content);
      if (!parsed) {
        throw new Error('Failed to parse JSON from response content');
      }
      return parsed;
    } catch (err) {
      console.error('[ShoppingAssistantService] Vision analysis failed, using text fallback:', err.message);
      return this.guessDetailsFromText(productName);
    }
  }

  /**
   * Run smart shopping wardrobe compatibility analysis
   */
  async analyzeWardrobeCompatibility(product, wardrobeItems) {
    const wardrobeText = wardrobeItems
      .map((item, idx) => {
        return `${idx + 1}. Name: ${item.name}, Category: ${item.category}, Color: ${item.color}, Pattern: ${item.pattern || 'Solid'}, Season: ${item.season || 'All'}, Occasion: ${item.occasion || 'Casual'}`;
      })
      .join('\n');

    const prompt = `You are an AI-powered smart shopping assistant. Analyze this Myntra product against the user's existing wardrobe before purchase to determine if it is a smart addition.

Product Details to Analyze:
- Name: ${product.name}
- Category: ${product.category || 'Unknown'}
- Color: ${product.color || 'Unknown'}
- Pattern: ${product.pattern || 'Solid'}
- Season: ${product.season || 'All-Season'}
- Occasion: ${product.occasion || 'Casual'}

User's Existing Wardrobe Items:
${wardrobeText || 'No items in wardrobe yet.'}

Evaluate the following:
1. Compatibility score (0-100) based on style matching, color coordination, and category compatibility with the existing wardrobe.
2. Confidence score (0-100) in this recommendation.
3. Whether this product fills a wardrobe gap (identify what gap is filled, e.g. "Office Shirts", or "None").
4. Outfit potential (describe the combination potential, e.g., "Can create 5 additional outfit combinations.").
5. A detailed, style-focused reason explaining why this item complements the wardrobe or why they should avoid it.

Set buyRecommendation strictly based on the compatibility score:
- CompatibilityScore >= 80: "Highly Recommended"
- CompatibilityScore 50 to 79: "Good Addition"
- CompatibilityScore < 50: "Not Recommended"

Return ONLY a valid JSON object in this format:
{
  "buyRecommendation": "Highly Recommended" | "Good Addition" | "Not Recommended",
  "compatibilityScore": 91,
  "confidence": 92,
  "reason": "Style explanation...",
  "wardrobeGap": "Office Shirts",
  "outfitPotential": "Can create 5 additional outfit combinations."
}`;

    if (!GROQ_API_KEY) {
      return this.getStaticFallbackAnalysis(product, wardrobeItems);
    }

    try {
      console.log('[ShoppingAssistantService] Calling Groq for compatibility analysis...');
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a smart shopping assistant. Output only valid JSON.' },
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
          timeout: 15000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      return JSON.parse(content.trim());
    } catch (err) {
      console.error('[ShoppingAssistantService] Groq compatibility analysis failed:', err.message);
      return this.getStaticFallbackAnalysis(product, wardrobeItems);
    }
  }

  guessDetailsFromText(name = '') {
    const lower = name.toLowerCase();
    let category = 'Topwear';
    if (lower.includes('pant') || lower.includes('jean') || lower.includes('trouser') || lower.includes('shorts') || lower.includes('skirt')) {
      category = 'Bottomwear';
    } else if (lower.includes('shoe') || lower.includes('sneaker') || lower.includes('sandal') || lower.includes('heel') || lower.includes('boot') || lower.includes('clog') || lower.includes('slider') || lower.includes('flip-flop')) {
      category = 'Footwear';
    } else if (lower.includes('jacket') || lower.includes('coat') || lower.includes('outerwear') || lower.includes('sweater') || lower.includes('hoodie')) {
      category = 'Outerwear';
    } else if (lower.includes('dress') || lower.includes('gown')) {
      category = 'Dress';
    } else if (lower.includes('watch') || lower.includes('belt') || lower.includes('bag') || lower.includes('accessories')) {
      category = 'Accessories';
    }

    let color = 'Black';
    const colors = ['white', 'blue', 'red', 'green', 'yellow', 'grey', 'navy', 'pink', 'beige', 'brown'];
    for (const c of colors) {
      if (lower.includes(c)) {
        color = c.charAt(0).toUpperCase() + c.slice(1);
        break;
      }
    }

    let pattern = 'Solid';
    if (lower.includes('stripe') || lower.includes('striped')) pattern = 'Striped';
    else if (lower.includes('check') || lower.includes('checked') || lower.includes('plaid')) pattern = 'Checked';
    else if (lower.includes('print') || lower.includes('printed') || lower.includes('graphic')) pattern = 'Printed';

    return {
      category,
      color,
      pattern,
      season: 'All Season',
      occasion: lower.includes('formal') || lower.includes('office') ? 'Formal' : 'Casual',
    };
  }

  getStaticFallbackAnalysis(product, wardrobeItems = []) {
    const category = product.category || 'Topwear';
    const color = product.color || 'Neutral';
    
    // 1. Calculate duplicates
    const duplicates = wardrobeItems.filter(item => 
      String(item.category || '').toLowerCase() === category.toLowerCase() &&
      String(item.color || '').toLowerCase() === color.toLowerCase()
    );

    // 2. Calculate matches in complementary categories
    const productCat = category.toLowerCase();
    let compCategories = [];
    if (productCat.includes('topwear') || productCat.includes('shirt') || productCat.includes('t-shirt')) {
      compCategories = ['bottomwear', 'footwear'];
    } else if (productCat.includes('bottomwear') || productCat.includes('pant') || productCat.includes('jeans') || productCat.includes('trouser') || productCat.includes('chino')) {
      compCategories = ['topwear', 'footwear'];
    } else if (productCat.includes('footwear') || productCat.includes('shoe') || productCat.includes('sneaker')) {
      compCategories = ['topwear', 'bottomwear'];
    } else {
      compCategories = ['topwear', 'bottomwear', 'footwear'];
    }

    const complementaryItems = wardrobeItems.filter(item => 
      compCategories.includes(String(item.category || '').toLowerCase())
    );

    // 3. Compute dynamic compatibility score
    let score = 65;
    
    // Add points for complementary items (versatility)
    score += Math.min(complementaryItems.length * 4, 20);

    // Color coordination bonus
    const isNeutral = ['black', 'white', 'grey', 'navy', 'beige', 'cream'].includes(color.toLowerCase());
    if (isNeutral) {
      score += 8;
    } else {
      const hasNeutralCompanion = wardrobeItems.some(item => 
        ['black', 'white', 'grey', 'navy', 'beige', 'cream'].includes(String(item.color || '').toLowerCase())
      );
      if (hasNeutralCompanion) score += 5;
    }

    // Deduct points for high duplicates (redundancy)
    if (duplicates.length > 0) {
      score -= Math.min(duplicates.length * 8, 25);
    }

    // Keep score bounded between 40 and 95
    score = Math.max(40, Math.min(95, score));

    // 4. Compute dynamic confidence based on wardrobe context
    let confidence = 82 + Math.min(wardrobeItems.length, 8) + (score % 5);
    confidence = Math.min(96, Math.max(80, confidence));

    // 5. Determine recommendation level
    let buyRecommendation = 'Good Addition';
    if (score >= 80) {
      buyRecommendation = 'Highly Recommended';
    } else if (score < 55) {
      buyRecommendation = 'Not Recommended';
    }

    // 6. Wardrobe Gap
    let wardrobeGap = 'None';
    if (duplicates.length === 0) {
      wardrobeGap = `${color} ${category}`;
    } else {
      wardrobeGap = `None (Already have ${duplicates.length} similar)`;
    }

    // 7. Outfit Potential
    const topsCount = wardrobeItems.filter(item => String(item.category || '').toLowerCase().includes('top')).length;
    const bottomsCount = wardrobeItems.filter(item => String(item.category || '').toLowerCase().includes('bottom')).length;
    
    let potentialCombinations = 0;
    if (productCat.includes('top')) {
      potentialCombinations = bottomsCount;
    } else if (productCat.includes('bottom')) {
      potentialCombinations = topsCount;
    } else if (productCat.includes('footwear')) {
      potentialCombinations = Math.min(topsCount, bottomsCount);
    } else {
      potentialCombinations = 2;
    }
    
    const outfitPotential = potentialCombinations > 0 
      ? `Can create ${potentialCombinations} additional outfit combination${potentialCombinations > 1 ? 's' : ''}.`
      : 'Can create 1 new combination with closet items.';

    // 8. Style Reason
    let reason = '';
    if (buyRecommendation === 'Highly Recommended') {
      reason = `This ${color.toLowerCase()} ${category.toLowerCase()} is highly versatile and fits perfectly into your wardrobe. It pairs easily with your existing ${complementaryItems.slice(0, 2).map(i => i.name).join(', ') || 'closet items'} with zero overlap.`;
    } else if (buyRecommendation === 'Not Recommended') {
      reason = `You already have ${duplicates.length} similar ${color.toLowerCase()} ${category.toLowerCase()}${duplicates.length > 1 ? 's' : ''} in your closet. Adding another might be redundant and won't increase your outfit versatility.`;
    } else {
      reason = `A solid ${color.toLowerCase()} option that coordinates well with your current wardrobe. It complements your style and provides reliable pairing options.`;
    }

    return {
      buyRecommendation,
      compatibilityScore: score,
      confidence,
      reason,
      wardrobeGap,
      outfitPotential
    };
  }
}

export default new ShoppingAssistantService();
