import axios from 'axios';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "GANTI_DENGAN_TOKEN_BOT_ANDA";

/**
 * Proxy untuk gambar Telegram.
 * 1. Mengambil URL asli dari file_id (mengatasi kadaluarsa 1 jam Telegram).
 * 2. Mengambil file binernya lalu meneruskan ke client (mengatasi ISP Indonesia memblokir api.telegram.org di browser).
 */
export async function proxyTelegramImage(req, res) {
  const { file_id } = req.query;
  if (!file_id) return res.status(400).send("Missing file_id");

  try {
    // 1. Dapatkan path file terbaru
    const fileRes = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${file_id}`);
    if (!fileRes.data.ok) {
      return res.status(404).send("File not found on Telegram");
    }

    const filePath = fileRes.data.result.file_path;
    const targetUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    // 2. Ambil gambar dan proxy ke client
    const imageRes = await axios.get(targetUrl, { responseType: 'stream' });
    
    res.setHeader("Content-Type", imageRes.headers["content-type"]);
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache 1 tahun di browser

    imageRes.data.pipe(res);
  } catch (error) {
    console.error("[Telegram Image Proxy Error]", error.message);
    res.status(500).send("Failed to proxy image");
  }
}
