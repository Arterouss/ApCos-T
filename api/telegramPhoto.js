import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "GANTI_DENGAN_TOKEN_BOT_ANDA";

/**
 * Mengambil daftar foto yang dikirim ke Bot Telegram.
 * Cara pakai: Kirimkan foto (JPEG/PNG) langsung ke chat bot Anda.
 */
export async function getTelegramPhotos() {
  if (BOT_TOKEN === "GANTI_DENGAN_TOKEN_BOT_ANDA") {
    throw new Error("TOKEN_NOT_SET: Telegram Bot Token belum diatur di Environment Variables!");
  }

  try {
    const response = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=100`);

    if (!response.data.ok) {
      throw new Error("Gagal mengambil data dari Telegram API");
    }

    const messages = response.data.result;
    const photos = [];

    for (const msg of messages) {
      const message = msg.message || msg.channel_post;
      if (!message) continue;

      // Telegram mengirim foto dalam beberapa ukuran, ambil yang terbesar (index terakhir)
      if (message.photo && message.photo.length > 0) {
        const largestPhoto = message.photo[message.photo.length - 1];
        
        try {
          const fileRes = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${largestPhoto.file_id}`
          );

          if (fileRes.data.ok) {
            const filePath = fileRes.data.result.file_path;
            const photoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

            photos.push({
              id: `${message.chat.id}_${message.message_id}`,
              url: photoUrl,
              caption: message.caption || null,
              date: new Date(message.date * 1000).toISOString(),
              width: largestPhoto.width,
              height: largestPhoto.height,
            });
          }
        } catch (fileErr) {
          console.warn(`[Telegram Photo] Gagal ambil file untuk msg ${message.message_id}:`, fileErr.message);
        }
      }
    }

    // Urutkan dari yang terbaru
    return photos.sort((a, b) => new Date(b.date) - new Date(a.date));

  } catch (error) {
    console.error("[Telegram Photo] Error:", error.message);
    throw error;
  }
}
