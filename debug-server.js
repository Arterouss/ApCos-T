import app from "./api/index.js";
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Debug Server running on http://localhost:${PORT}`);
  console.log(`Test Creators: http://localhost:${PORT}/api/creators`);
});
