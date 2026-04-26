const fs = require('fs');
let c = fs.readFileSync('api/index.js', 'utf8');

// Fix 1: Replace app.listen block with conditional + export default
const oldEnd = `// Start Server\r\napp.listen(PORT, () => {\r\n  console.log(\`Proxy server running at http://localhost:\${PORT}\`);\r\n});\r\n`;
const newEnd = `// Local dev: listen on PORT. Vercel uses export default below.\r\nif (process.env.NODE_ENV !== "production") {\r\n  app.listen(PORT, () => {\r\n    console.log(\`Proxy server running at http://localhost:\${PORT}\`);\r\n  });\r\n}\r\n\r\nexport default app;\r\n`;

if (c.includes('// Start Server')) {
  c = c.replace('// Start Server\r\napp.listen(PORT, () => {\r\n  console.log(`Proxy server running at http://localhost:${PORT}`);\r\n});\r\n', newEnd);
  fs.writeFileSync('api/index.js', c);
  console.log('Fixed! export default app added:', c.includes('export default app'));
} else {
  console.log('Pattern not found. Last 200 chars:', c.slice(-200));
}
