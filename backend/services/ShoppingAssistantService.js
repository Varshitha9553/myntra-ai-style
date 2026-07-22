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
      return this.getStaticFallbackAnalysis(product);
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
      return this.getStaticFallbackAnalysis(product);
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

  getStaticFallbackAnalysis(product) {
    const category = product.category || 'Topwear';
    const score = 72;
    return {
      buyRecommendation: 'Good Addition',
      compatibilityScore: score,
      confidence: 85,
      reason: `This ${product.color || 'neutral'} ${category.toLowerCase()} is a solid pick that matches multiple standard items in your closet.`,
      wardrobeGap: `${product.color || 'Neutral'} ${category}`,
      outfitPotential: 'Can create 3 additional outfit combinations.',
    };
  }
}

export default new ShoppingAssistantService();
