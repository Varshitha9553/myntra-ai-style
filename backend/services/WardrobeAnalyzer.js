class WardrobeAnalyzer {
  analyze(wardrobeItems = []) {
    // Normalize single item category or return normalized
    const normalizeCat = (cat) => {
      if (!cat) return '';
      const c = String(cat).toLowerCase().trim();
      // Map frontend-style names to actual DB values
      if (c === 'top' || c === 'topwear') return 'Topwear';
      if (c === 'bottom' || c === 'bottomwear') return 'Bottomwear';
      if (c === 'dress') return 'Dress';
      if (c === 'outerwear') return 'Outerwear';
      if (c === 'shoes' || c === 'footwear') return 'Footwear';
      if (c === 'accessory' || c === 'accessories') return 'Accessories';
      return cat; // return as-is if no mapping
    };

    return {
      stats: [
        { label: 'Total Clothes', value: wardrobeItems.length, icon: 'Shirt' },
        { label: 'Tops', value: wardrobeItems.filter((item) => normalizeCat(item.category) === 'Topwear').length, icon: 'Shirt' },
        { label: 'Bottoms', value: wardrobeItems.filter((item) => normalizeCat(item.category) === 'Bottomwear').length, icon: 'Package' },
        { label: 'Dresses', value: wardrobeItems.filter((item) => normalizeCat(item.category) === 'Dress').length, icon: 'Sparkles' },
        { label: 'Shoes', value: wardrobeItems.filter((item) => normalizeCat(item.category) === 'Footwear').length, icon: 'Footprints' },
        { label: 'Accessories', value: wardrobeItems.filter((item) => normalizeCat(item.category) === 'Accessories').length, icon: 'Watch' },
      ],
      aiTags: ['Casual', 'Formal', 'Summer', 'Winter', 'Smart'],
    };
  }
}

export default new WardrobeAnalyzer();
