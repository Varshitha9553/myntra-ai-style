import WardrobeService from '../services/WardrobeService.js';

export async function generateTravelCapsule(req, res, next) {
  try {
    const userId = req.user?.sub || 1;
    const { destination, duration, occasion } = req.body;

    if (!destination || !duration || !occasion) {
      return res.status(400).json({ error: 'Destination, duration, and occasion are required' });
    }

    const tripDuration = parseInt(duration, 10);
    if (isNaN(tripDuration) || tripDuration <= 0) {
      return res.status(400).json({ error: 'Duration must be a positive number' });
    }

    // 1. Fetch all wardrobe items
    const allItems = await WardrobeService.list(userId, {});

    if (!allItems || allItems.length === 0) {
      return res.json({
        capsule: [],
        extras: [],
        outfits: [],
        message: 'Your closet is currently empty! Add some clothes to your wardrobe first.'
      });
    }

    // Normalize input occasion for comparison
    const targetOccasion = occasion.toLowerCase().trim();

    // 2. Group items by category
    const categorized = {
      Topwear: [],
      Bottomwear: [],
      Footwear: [],
      Outerwear: [],
      Dress: [],
      Accessories: []
    };

    allItems.forEach(item => {
      const cat = item.category || 'Accessories';
      if (categorized[cat]) {
        categorized[cat].push(item);
      } else {
        categorized['Accessories'].push(item);
      }
    });

    // 3. Dynamic sizing rules based on trip duration
    let topsNeeded = Math.min(Math.max(2, Math.ceil(tripDuration * 0.6)), 5);
    let bottomsNeeded = Math.min(Math.max(1, Math.ceil(tripDuration * 0.35)), 3);
    let footwearNeeded = tripDuration >= 5 ? 2 : 1;
    let outerwearNeeded = 1;
    let dressOrAccNeeded = tripDuration >= 4 ? 2 : 1;

    // Helper to sort items by matching occasion & neutral colors (cohesive styling)
    const sortForCapsule = (itemsList) => {
      const neutrals = new Set(['white', 'black', 'grey', 'gray', 'beige', 'cream', 'navy', 'brown']);
      return [...itemsList].sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        // Occasion match bonus
        if (String(a.occasion).toLowerCase().includes(targetOccasion)) scoreA += 5;
        if (String(b.occasion).toLowerCase().includes(targetOccasion)) scoreB += 5;

        // Neutral color match (highly versatile for capsules)
        if (neutrals.has(String(a.color).toLowerCase())) scoreA += 2;
        if (neutrals.has(String(b.color).toLowerCase())) scoreB += 2;

        return scoreB - scoreA;
      });
    };

    // Sort all categories
    Object.keys(categorized).forEach(cat => {
      categorized[cat] = sortForCapsule(categorized[cat]);
    });

    // 4. Select base capsule items
    const baseCapsule = [];
    const remainingPool = { ...categorized };

    const selectItems = (category, count) => {
      const selected = remainingPool[category].slice(0, count);
      remainingPool[category] = remainingPool[category].slice(count);
      return selected;
    };

    baseCapsule.push(...selectItems('Topwear', topsNeeded));
    baseCapsule.push(...selectItems('Bottomwear', bottomsNeeded));
    baseCapsule.push(...selectItems('Footwear', footwearNeeded));
    baseCapsule.push(...selectItems('Outerwear', outerwearNeeded));
    baseCapsule.push(...selectItems('Dress', dressOrAccNeeded));

    // If still have budget for accessories/dresses
    if (categorized['Accessories'].length > 0) {
      baseCapsule.push(...selectItems('Accessories', 1));
    }

    // 5. Select 2-3 extra items (Backups/Spares) as per user comment
    const extrasCount = tripDuration >= 5 ? 3 : 2;
    const extras = [];
    
    // Attempt to pull backups from remaining Topwear, Bottomwear, or Accessories
    const extraCategories = ['Topwear', 'Bottomwear', 'Accessories', 'Outerwear', 'Dress', 'Footwear'];
    let selectedExtras = 0;

    for (const cat of extraCategories) {
      if (selectedExtras >= extrasCount) break;
      const available = remainingPool[cat] || [];
      if (available.length > 0) {
        extras.push({ ...available[0], isExtra: true });
        remainingPool[cat] = available.slice(1);
        selectedExtras++;
      }
    }

    // Fallback: If no remaining categorized items, pick from any remaining category pool
    if (extras.length < extrasCount) {
      for (const cat of extraCategories) {
        if (extras.length >= extrasCount) break;
        const available = remainingPool[cat] || [];
        if (available.length > 0) {
          extras.push({ ...available[0], isExtra: true });
          remainingPool[cat] = available.slice(1);
        }
      }
    }

    // 6. Generate 40+ outfit combinations from capsule + extras
    // Outfit = Topwear + Bottomwear + Footwear (+ Outerwear) OR Dress + Footwear (+ Outerwear)
    const combinations = [];
    const allTops = [...baseCapsule.filter(i => i.category === 'Topwear'), ...extras.filter(i => i.category === 'Topwear')];
    const allBottoms = [...baseCapsule.filter(i => i.category === 'Bottomwear'), ...extras.filter(i => i.category === 'Bottomwear')];
    const allShoes = [...baseCapsule.filter(i => i.category === 'Footwear'), ...extras.filter(i => i.category === 'Footwear')];
    const allLayers = [...baseCapsule.filter(i => i.category === 'Outerwear'), ...extras.filter(i => i.category === 'Outerwear')];
    const allDresses = [...baseCapsule.filter(i => i.category === 'Dress'), ...extras.filter(i => i.category === 'Dress')];

    let combId = 1;

    // Pair Tops & Bottoms & Shoes
    allTops.forEach(top => {
      allBottoms.forEach(bottom => {
        allShoes.forEach(shoe => {
          // Standard style
          combinations.push({
            id: combId++,
            name: `${occasion} Day Look ${combId - 1}`,
            items: [top, bottom, shoe],
            occasion: occasion,
            notes: `Perfect coordination matching ${top.color} and ${bottom.color}.`
          });

          // Layered style (with Outerwear)
          allLayers.forEach(layer => {
            combinations.push({
              id: combId++,
              name: `Layered Travel Style ${combId - 1}`,
              items: [top, bottom, shoe, layer],
              occasion: occasion,
              notes: `Stylish travel layer with the ${layer.name}.`
            });
          });
        });
      });
    });

    // Pair Dresses & Shoes
    allDresses.forEach(dress => {
      allShoes.forEach(shoe => {
        combinations.push({
          id: combId++,
          name: `Chic Trip Dress Styling ${combId - 1}`,
          items: [dress, shoe],
          occasion: occasion,
          notes: `Effortless dress combination for your trip to ${destination}.`
        });

        // Layered Dress style
        allLayers.forEach(layer => {
          combinations.push({
            id: combId++,
            name: `Cozy Evening Look ${combId - 1}`,
            items: [dress, shoe, layer],
            occasion: occasion,
            notes: `Comfortable and warm styling.`
          });
        });
      });
    });

    // Sort to show the best matches (e.g. color-coordinated and original capsule items first)
    combinations.sort((a, b) => {
      // Prioritize combinations that use no 'extra/backup' items first for base capsule styling
      const aExtras = a.items.filter(i => i.isExtra).length;
      const bExtras = b.items.filter(i => i.isExtra).length;
      return aExtras - bExtras;
    });

    // Return the response, cap combinations list at a premium 50 items max
    res.json({
      capsule: baseCapsule,
      extras: extras,
      outfits: combinations.slice(0, 50),
      destination,
      duration: tripDuration,
      occasion
    });
  } catch (error) {
    next(error);
  }
}
