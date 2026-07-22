class DuplicateDetector {
  async checkDuplicate(productName, wardrobeItems = []) {
    const matches = wardrobeItems.filter((item) => item.name.toLowerCase().includes(productName.toLowerCase()));
    return {
      isDuplicate: matches.length > 0,
      confidence: 0.86,
      matches,
    };
  }
}

export default new DuplicateDetector();
