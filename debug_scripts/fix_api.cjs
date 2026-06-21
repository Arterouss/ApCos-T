const fs = require('fs');
let c = fs.readFileSync('api/index.js', 'utf8');

// Find start and end of the orphaned junk
const junkedStart = c.indexOf('\n    res.status(5\n// ==========================================\n      // direct link fallback\n      originalUrl: url,\n    });\n  } catch (error) {\n    console.error("Oreno3D Detail Error:", error.message);\n    res.status(500).json({ error: "Failed to fetch detail" });\n  }\n});\n');
if (junkedStart !== -1) {
  const junkedEnd = junkedStart + '\n    res.status(5\n// ==========================================\n      // direct link fallback\n      originalUrl: url,\n    });\n  } catch (error) {\n    console.error("Oreno3D Detail Error:", error.message);\n    res.status(500).json({ error: "Failed to fetch detail" });\n  }\n});\n'.length;
  const before = c.substring(0, junkedStart);
  const after = c.substring(junkedEnd);
  c = before + '\n  }\n});\n\n' + after;
  fs.writeFileSync('api/index.js', c);
  console.log('Fixed! Junk removed at position', junkedStart);
} else {
  console.log('Pattern not found, checking for alternative...');
  // Show lines around where it would be
  const lines = c.split('\n');
  const idx = lines.findIndex(l => l.includes('res.status(5'));
  console.log('Found status(5 at line:', idx);
  if (idx !== -1) {
    console.log(lines.slice(idx-2, idx+10).join('\n'));
  }
}
