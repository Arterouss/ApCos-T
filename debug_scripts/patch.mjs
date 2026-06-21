import fs from 'fs';

const file = 'api/index.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '      headers["Range"] = req.headers.range;\r\n    }',
  '      headers["Range"] = req.headers.range;\r\n    }\r\n\r\n    if (req.headers["x-version"]) {\r\n      headers["X-Version"] = req.headers["x-version"];\r\n    }'
);

content = content.replace(
  '      headers["Range"] = req.headers.range;\n    }',
  '      headers["Range"] = req.headers.range;\n    }\n\n    if (req.headers["x-version"]) {\n      headers["X-Version"] = req.headers["x-version"];\n    }'
);

fs.writeFileSync(file, content);
console.log('Done');
