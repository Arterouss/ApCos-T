const fs = require('fs');
let content = fs.readFileSync('api/index.js', 'utf8');

// Find the block to delete: from parseOreno3dPosts down to (but not including) // CAVPORN
const startMarker = '\n\n\nconst parseOreno3dPosts';
const endMarker = '\n// ==========================================\r\n// CAVPORN SCRAPER';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  console.log(`Removing from index ${startIdx} to ${endIdx}`);
  console.log('Chars to remove:', endIdx - startIdx);
  const before = content.substring(0, startIdx);
  const after = content.substring(endIdx);
  const newContent = before + '\n\n' + after;
  fs.writeFileSync('api/index.js', newContent);
  console.log('Done!');
} else {
  console.log('Markers not found at top level. Searching...');
  console.log('startMarker found:', content.indexOf(startMarker));
  
  // Try alternative
  const altStart = content.indexOf('\n\n \n\nconst parseOreno3dPosts');
  const altStart2 = content.indexOf('\nconst parseOreno3dPosts');
  console.log('altStart:', altStart, 'altStart2:', altStart2);
  
  if (altStart2 !== -1) {
    const newEndMarker = '\n// ==========================================\r\n// CAVPORN';
    const ei = content.indexOf(newEndMarker);
    console.log('endIdx with CAVPORN:', ei);
    if (ei !== -1) {
      const before = content.substring(0, altStart2);
      const after = content.substring(ei);
      fs.writeFileSync('api/index.js', before + '\n\n' + after);
      console.log('Fixed with altStart2!');
    }
  }
}
