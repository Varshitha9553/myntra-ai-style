import ShoppingAssistantService from '../services/ShoppingAssistantService.js';
import WardrobeService from '../services/WardrobeService.js';
import DuplicateDetectionService from '../services/DuplicateDetectionService.js';
import { createConnection } from '../config/oracle.js';
import axios from 'axios';

async function fetchMyntraDetails(url) {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 2500
    });
    
    if (res.status !== 200) return null;
    const html = res.data;

    const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) || 
                     html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
    let imageUrl = imgMatch ? imgMatch[1] : null;
    if (imageUrl) {
      imageUrl = imageUrl.replace('h_200,w_200,c_fill,g_auto/', '');
    }

    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) || 
                       html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/i) ||
                       html.match(/<title>([^<]+)<\/title>/i);
    let name = titleMatch ? titleMatch[1].trim() : null;
    if (name) {
      name = name
        .replace(/\s*-\s*-?\s*Footwear.*$/i, '')
        .replace(/\s*-\s*-?\s*Clothing.*$/i, '')
        .replace(/\s*-\s*Buy Online.*$/i, '')
        .replace(/\s*\|\s*Myntra.*$/i, '')
        .trim();
    }

    const colorMatch = html.match(/"primaryColor"\s*:\s*"([^"]+)"/i) || 
                       html.match(/"articleColor"\s*:\s*"([^"]+)"/i) || 
                       html.match(/"base_colour"\s*:\s*"([^"]+)"/i);
    const color = colorMatch ? colorMatch[1].trim() : null;

    const brandMatch = html.match(/"brand"\s*:\s*\{\s*"name"\s*:\s*"([^"]+)"/i) ||
                       html.match(/"brandName"\s*:\s*"([^"]+)"/i) ||
                       html.match(/"brand"\s*:\s*"([^"]+)"/i);
    const brand = brandMatch ? brandMatch[1].trim() : null;

    const priceMatch = html.match(/"price"\s*:\s*"?(\d+)"?/i) || 
                       html.match(/"discountedPrice"\s*:\s*"?(\d+)"?/i) ||
                       html.match(/"sellingPrice"\s*:\s*"?(\d+)"?/i);
    const price = priceMatch ? parseInt(priceMatch[1]) : null;

    const mrpMatch = html.match(/"mrp"\s*:\s*"?(\d+)"?/i);
    const mrp = mrpMatch ? parseInt(mrpMatch[1]) : null;

    return { name, imageUrl, color, brand, price, mrp };
  } catch (err) {
    console.error('[Scraper] Failed to fetch details from Myntra URL:', err.message);
    return null;
  }
}

function parseMyntraUrlFallback(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    if (pathParts.length === 0) return null;

    let slug = "";
    for (const part of pathParts) {
      if (part.includes("-") && !/^\d+$/.test(part)) {
        slug = part;
        break;
      }
    }

    if (!slug) {
      slug = pathParts[0];
    }

    const name = slug
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    let brand = 'Myntra Pick';
    const brandIdx = pathParts.indexOf(slug) - 1;
    if (brandIdx >= 0) {
      brand = pathParts[brandIdx].charAt(0).toUpperCase() + pathParts[brandIdx].slice(1);
    }

    let category = "Bottomwear";
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("pant") || lowerUrl.includes("trousers") || lowerUrl.includes("jeans") || lowerUrl.includes("shorts") || lowerUrl.includes("skirt") || lowerUrl.includes("chinos")) {
      category = "Bottomwear";
    } else if (lowerUrl.includes("shoe") || lowerUrl.includes("sneaker") || lowerUrl.includes("footwear") || lowerUrl.includes("sandal") || lowerUrl.includes("canvas") || lowerUrl.includes("lace-up") || lowerUrl.includes("slip-on") || lowerUrl.includes("flip-flop") || lowerUrl.includes("slider") || lowerUrl.includes("clog") || lowerUrl.includes("boot") || lowerUrl.includes("heel")) {
      category = "Footwear";
    } else if (lowerUrl.includes("jacket") || lowerUrl.includes("coat") || lowerUrl.includes("sweater") || lowerUrl.includes("shrug") || lowerUrl.includes("hoodie")) {
      category = "Outerwear";
    } else if (lowerUrl.includes("dress") || lowerUrl.includes("saree") || lowerUrl.includes("kurta")) {
      category = "Dress";
    } else if (lowerUrl.includes("watch") || lowerUrl.includes("belt") || lowerUrl.includes("bag") || lowerUrl.includes("accessories")) {
      category = "Accessories";
    }

    let color = 'Neutral';
    const colors = ['white', 'black', 'blue', 'red', 'green', 'yellow', 'grey', 'navy', 'pink', 'beige', 'brown', 'olive'];
    for (const c of colors) {
      if (lowerUrl.includes(c)) {
        color = c.charAt(0).toUpperCase() + c.slice(1);
        break;
      }
    }

    let matchedImage = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80";
    if (category === "Topwear") {
      matchedImage = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80";
    } else if (category === "Bottomwear") {
      matchedImage = "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80";
    } else if (category === "Footwear") {
      matchedImage = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80";
    } else if (category === "Outerwear") {
      matchedImage = "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80";
    }

    return {
      name,
      category,
      color,
      brand,
      price: 1499,
      imageUrl: matchedImage
    };
  } catch (e) {
    return null;
  }
}

function selectMatchingItems(product, wardrobeItems) {
  const productCat = String(product.category || '').toLowerCase();
  
  let targetCategories = [];
  if (productCat.includes('topwear') || productCat.includes('shirt') || productCat.includes('t-shirt')) {
    targetCategories = ['bottomwear', 'footwear', 'accessories'];
  } else if (productCat.includes('bottomwear') || productCat.includes('pant') || productCat.includes('jeans') || productCat.includes('trouser')) {
    targetCategories = ['topwear', 'footwear', 'outerwear'];
  } else if (productCat.includes('footwear') || productCat.includes('shoe') || productCat.includes('sneaker')) {
    targetCategories = ['topwear', 'bottomwear', 'outerwear'];
  } else {
    targetCategories = ['topwear', 'bottomwear', 'footwear'];
  }

  const matches = wardrobeItems.filter(item => {
    const itemCat = String(item.category || '').toLowerCase();
    return targetCategories.some(cat => itemCat.includes(cat));
  });

  return matches.slice(0, 4);
}

export async function analyzeShoppingProduct(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    const { productId, customProduct, myntraUrl } = req.body;

    let product = null;

    if (myntraUrl) {
      let scraped = await fetchMyntraDetails(myntraUrl);
      if (!scraped || !scraped.imageUrl) {
        scraped = parseMyntraUrlFallback(myntraUrl);
      }
      if (scraped && scraped.imageUrl) {
        let category = 'Topwear';
        const lowerUrl = myntraUrl.toLowerCase();
        if (lowerUrl.includes('pant') || lowerUrl.includes('trousers') || lowerUrl.includes('jeans') || lowerUrl.includes('shorts') || lowerUrl.includes('skirt') || lowerUrl.includes('chinos')) {
          category = 'Bottomwear';
        } else if (lowerUrl.includes('shoe') || lowerUrl.includes('sneaker') || lowerUrl.includes('footwear') || lowerUrl.includes('sandal') || lowerUrl.includes('canvas') || lowerUrl.includes('lace-up') || lowerUrl.includes('slip-on') || lowerUrl.includes('flip-flop') || lowerUrl.includes('slider') || lowerUrl.includes('clog') || lowerUrl.includes('boot') || lowerUrl.includes('heel')) {
          category = 'Footwear';
        } else if (lowerUrl.includes('jacket') || lowerUrl.includes('coat') || lowerUrl.includes('sweater') || lowerUrl.includes('shrug') || lowerUrl.includes('hoodie')) {
          category = 'Outerwear';
        } else if (lowerUrl.includes('dress') || lowerUrl.includes('saree') || lowerUrl.includes('kurta')) {
          category = 'Dress';
        } else if (lowerUrl.includes('watch') || lowerUrl.includes('belt') || lowerUrl.includes('bag') || lowerUrl.includes('accessories')) {
          category = 'Accessories';
        }

        product = {
          name: scraped.name || 'Pasted Myntra Product',
          category,
          price: scraped.price || (Math.floor(Math.random() * 1500) + 999),
          mrp: scraped.mrp || null,
          imageUrl: scraped.imageUrl,
          color: scraped.color || null,
          brand: scraped.brand || null,
        };
      }
    }

    if (!product && customProduct) {
      product = customProduct;
    } else if (!product && productId) {
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
          product = {
            name: row.NAME ?? row.name,
            category: row.CATEGORY ?? row.category,
            price: row.PRICE ?? row.price,
            mrp: row.MRP ?? row.mrp,
            imageUrl: row.IMAGE_URL ?? row.image_url,
            reason: row.REASON ?? row.reason,
          };
        }
      } catch (dbErr) {
        console.warn('[Shopping Assistant Controller] DB fetch failed, using fallback:', dbErr.message);
      } finally {
        await connection.close();
      }
    }

    if (!product) {
      product = {
        name: 'Classic White Oxford Shirt',
        category: 'Topwear',
        color: 'White',
        price: 2499,
        imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80',
        reason: 'A versatile staple for your wardrobe.',
      };
    }



    // Call vision analysis if any product metadata is missing
    if (!product.color || !product.pattern || !product.season || !product.occasion) {
      try {
        const visionDetails = await ShoppingAssistantService.analyzeProductImage(product.imageUrl, product.name);
        let finalCat = visionDetails.category || product.category;
        product = {
          ...product,
          category: finalCat,
          color: visionDetails.color || product.color,
          pattern: visionDetails.pattern || product.pattern,
          season: visionDetails.season || product.season,
          occasion: visionDetails.occasion || product.occasion,
        };
      } catch (visErr) {
        console.error('[Shopping Assistant Controller] Image vision analysis failed:', visErr.message);
        const inferred = ShoppingAssistantService.guessDetailsFromText(product.name);
        let finalCat = inferred.category || product.category;
        product = {
          ...product,
          category: finalCat,
          color: inferred.color || product.color,
          pattern: inferred.pattern || product.pattern,
          season: inferred.season || product.season,
          occasion: inferred.occasion || product.occasion,
        };
      }
    }

    const wardrobeItems = await WardrobeService.list(userId);
    const compatibility = await ShoppingAssistantService.analyzeWardrobeCompatibility(product, wardrobeItems);
    const duplicate = await DuplicateDetectionService.detectDuplicates(userId, { selectedProduct: product });
    const matchingItems = selectMatchingItems(product, wardrobeItems);

    res.status(200).json({
      product,
      compatibility,
      duplicate,
      matchingItems,
    });
  } catch (error) {
    console.error('[Shopping Assistant Controller] Analysis error:', error.message);
    next(error);
  }
}
