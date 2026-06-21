const fs = require('fs');

let content = fs.readFileSync('api/index.js', 'utf8');

// The user wants https://pornavhd.com/
// We replace the specific domains used previously
content = content.replace(/PornavHD\.si/g, 'pornavhd.com');
content = content.replace(/PornavHD\.cr/g, 'pornavhd.com');
content = content.replace(/PornavHD\.ru/g, 'pornavhd.com');
content = content.replace(/PornavHD\.ph/g, 'pornavhd.com');
content = content.replace(/PornavHD\.la/g, 'pornavhd.com');
content = content.replace(/PornavHD-albums\.io/g, 'pornavhd.com');

fs.writeFileSync('api/index.js', content);
console.log('Replaced PornavHD domains with pornavhd.com in api/index.js');
