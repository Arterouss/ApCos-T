import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "GANTI_DENGAN_TOKEN_BOT_ANDA";

/**
 * Mengambil daftar foto yang dikirim ke Bot Telegram.
 * Mendukung pengiriman album (banyak foto sekaligus) — caption akan
 * otomatis dibagikan ke semua foto dalam satu album yang sama.
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

    const updates = response.data.result;

    // ── Langkah 1: Kumpulkan semua pesan foto mentah ────────────────────────
    const rawPhotos = [];
    for (const update of updates) {
      const message = update.message || update.channel_post;
      if (!message || !message.photo || message.photo.length === 0) continue;

      const largestPhoto = message.photo[message.photo.length - 1];
      rawPhotos.push({
        message_id: message.message_id,
        chat_id:    message.chat.id,
        file_id:    largestPhoto.file_id,
        width:      largestPhoto.width,
        height:     largestPhoto.height,
        caption:    message.caption || null,         // Hanya ada di foto pertama album
        group_id:   message.media_group_id || null,  // ID album, null jika foto tunggal
        date:       new Date(message.date * 1000).toISOString(),
      });
    }

    // ── Langkah 2: Sebarkan caption ke semua foto dalam album yang sama ──────
    // Cari caption untuk setiap group_id
    const groupCaptions = {};
    for (const p of rawPhotos) {
      if (p.group_id && p.caption) {
        groupCaptions[p.group_id] = p.caption;
      }
    }
    // Terapkan caption grup ke semua foto yang belum punya caption
    for (const p of rawPhotos) {
      if (p.group_id && !p.caption && groupCaptions[p.group_id]) {
        p.caption = groupCaptions[p.group_id];
      }
    }

    // ── Langkah 3: Ambil URL file dari Telegram API (paralel) ───────────────
    const photos = [];
    await Promise.all(
      rawPhotos.map(async (p) => {
        try {
          const fileRes = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${p.file_id}`
          );
          if (fileRes.data.ok) {
            const filePath = fileRes.data.result.file_path;
            photos.push({
              id:      `${p.chat_id}_${p.message_id}`,
              url:     `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`,
              caption: p.caption,
              date:    p.date,
              width:   p.width,
              height:  p.height,
            });
          }
        } catch (err) {
          console.warn(`[Telegram Photo] Skip msg ${p.message_id}:`, err.message);
        }
      })
    );

    // Urutkan dari yang terbaru
    return photos.sort((a, b) => new Date(b.date) - new Date(a.date));

  } catch (error) {
    console.error("[Telegram Photo] Error:", error.message);
    throw error;
  }
}

