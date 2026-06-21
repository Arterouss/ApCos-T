const fs = require('fs');
const content = fs.readFileSync('api/index.js', 'utf8');

// Check if already imported
if (content.includes("import { createHash }")) {
  console.log("createHash already imported.");
} else {
  const updated = content.replace(
    "import https from \"https\";",
    "import https from \"https\";\nimport { createHash } from \"crypto\";"
  );
  fs.writeFileSync('api/index.js', updated);
  console.log('Added createHash import:', updated.includes('createHash'));
}
