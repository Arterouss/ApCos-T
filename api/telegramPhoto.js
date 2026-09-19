import axios from 'axios';
import { connectDB } from './telegramDb.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "GANTI_DENGAN_TOKEN_BOT_ANDA";

/**
 * Mengambil daftar foto dari Database MongoDB.
 * Jika Webhook belum aktif, fungsi ini juga akan me-sync dari getUpdates (fallback sementara).
 */
export async function getTelegramPhotos() {
  const db = await connectDB();
  const collection = db.collection("telegram_photos");

  // Fallback Sync: Cek pesan 24 jam terakhir dari Telegram agar tidak ada yang hilang sebelum Webhook aktif
  if (BOT_TOKEN !== "GANTI_DENGAN_TOKEN_BOT_ANDA") {
    try {
      const response = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=100`);
      if (response.data.ok) {
        const updates = response.data.result;
        const rawPhotos = [];
        
        for (const update of updates) {
          const message = update.message || update.channel_post;
          if (!message || !message.photo || message.photo.length === 0) continue;

          const largestPhoto = message.photo[message.photo.length - 1];
          rawPhotos.push({
            id:         `${message.chat.id}_${message.message_id}`,
            message_id: message.message_id,
            chat_id:    message.chat.id,
            file_id:    largestPhoto.file_id,
            width:      largestPhoto.width,
            height:     largestPhoto.height,
            caption:    message.caption || null,
            group_id:   message.media_group_id || null,
            date:       new Date(message.date * 1000).toISOString(),
          });
        }
        
        // Sebarkan caption untuk album
        const groupCaptions = {};
        for (const p of rawPhotos) {
          if (p.group_id && p.caption) groupCaptions[p.group_id] = p.caption;
        }
        for (const p of rawPhotos) {
          if (p.group_id && !p.caption && groupCaptions[p.group_id]) p.caption = groupCaptions[p.group_id];
        }

        // Simpan foto baru ke Database
        for (const p of rawPhotos) {
          const exists = await collection.findOne({ id: p.id });
          if (!exists) {
            try {
              const fileRes = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${p.file_id}`);
              if (fileRes.data.ok) {
                const filePath = fileRes.data.result.file_path;
                p.url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
                p.deleted = false;
                await collection.insertOne(p);
              }
            } catch (err) {
              console.warn(`[Telegram Photo Sync] Skip msg ${p.message_id}:`, err.message);
            }
          }
        }
      }
    } catch (error) {
      console.warn("[Telegram Sync Warning] Gagal fetch getUpdates (biasanya karena webhook sudah nyala):", error.message);
    }
  }

  // Ambil SEMUA foto dari MongoDB yang belum dihapus, diurutkan dari yang terbaru
  const photos = await collection.find({ deleted: { $ne: true } }).sort({ date: -1 }).toArray();
  return photos;
}

/**
 * Menghapus foto dari database (Soft Delete)
 */
export async function deleteTelegramPhoto(id) {
  const db = await connectDB();
  const collection = db.collection("telegram_photos");
  const result = await collection.updateOne({ id }, { $set: { deleted: true } });
  return result.modifiedCount > 0;
}
