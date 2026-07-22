import fs from 'fs';

const contentPath = 'C:\\Users\\vijja\\.gemini\\antigravity\\brain\\6a29a87a-521b-489b-9db2-d2aa124ef33d\\.system_generated\\steps\\2730\\content.md';
const content = fs.readFileSync(contentPath, 'utf8');

const regex = /[a-zA-Z0-9.-]+\/[a-zA-Z0-9.-]+/g;
const matches = content.match(regex) || [];
const uniqueMatches = Array.from(new Set(matches));
const filtered = uniqueMatches.filter(m => !m.startsWith('http') && !m.startsWith('//') && !m.includes('.png') && !m.includes('.js') && !m.includes('woff'));

console.log(JSON.stringify(filtered, null, 2));
