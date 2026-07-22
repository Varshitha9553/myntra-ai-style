import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAnalysis } from '../services/GroqService.js';

test('normalizes Groq image analysis into wardrobe metadata', () => {
  const rawResponse = `{
    "clothingType": "Blazer",
    "color": "Navy",
    "pattern": "Striped",
    "season": "Winter",
    "occasion": "Office"
  }`;

  assert.deepEqual(normalizeAnalysis(rawResponse), {
    category: 'Blazer',
    color: 'Navy',
    pattern: 'Striped',
    season: 'Winter',
    occasion: 'Office',
    aiTags: ['AI Tagged'],
  });
});
