import { connectDB } from './telegramDb.js';
import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "GANTI_DENGAN_TOKEN_BOT_ANDA";

/**
 * Endpoint webhook untuk menerima update instan dari Telegram
 */
export async function handleTelegramWebhook(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const update = req.body;
  if (!update) {
    return res.status(400).json({ error: 'Bad Request' });
  }

  const message = update.message || update.channel_post;
  if (!message || !message.photo || message.photo.length === 0) {
    // Abaikan pesan tanpa foto
    return res.status(200).send('OK');
  }

  try {
    const db = await connectDB();
    const collection = db.collection("telegram_photos");

    const largestPhoto = message.photo[message.photo.length - 1];
    const id = `${message.chat.id}_${message.message_id}`;

    const newPhoto = {
      id:         id,
      message_id: message.message_id,
      chat_id:    message.chat.id,
      file_id:    largestPhoto.file_id,
      width:      largestPhoto.width,
      height:     largestPhoto.height,
      caption:    message.caption || null,
      group_id:   message.media_group_id || null,
      date:       new Date(message.date * 1000).toISOString(),
      deleted:    false,
    };

    // Ambil URL file
    const fileRes = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${newPhoto.file_id}`);
    if (fileRes.data.ok) {
      const filePath = fileRes.data.result.file_path;
      newPhoto.url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
      
      // FIX RACE CONDITION UNTUK ALBUM CAPTION
      if (newPhoto.group_id) {
        if (!newPhoto.caption) {
          // Kasus 1: Webhook foto tanpa caption tiba lebih lambat/cepat.
          // Cek apakah ada foto lain di grup ini yang sudah punya caption di DB.
          const sibling = await collection.findOne({ group_id: newPhoto.group_id, caption: { $ne: null } });
          if (sibling) {
            newPhoto.caption = sibling.caption;
          }
        }
      }

      // Simpan ke MongoDB (upsert agar tidak ganda)
      await collection.updateOne({ id: newPhoto.id }, { $set: newPhoto }, { upsert: true });

      // Kasus 2: Webhook foto yang bawa caption tiba. Update saudara-saudaranya yang mungkin
      // sudah masuk duluan ke DB tapi caption-nya masih null.
      if (newPhoto.group_id && newPhoto.caption) {
        await collection.updateMany(
          { group_id: newPhoto.group_id, caption: null },
          { $set: { caption: newPhoto.caption } }
        );
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error("[Webhook Error]", error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Mendaftarkan Webhook Telegram ke URL Vercel ini
 */
export async function setTelegramWebhook(req, res) {
  // Gunakan host saat ini (misal: ap-cos-t.vercel.app)
  const host = req.headers.host;
  const webhookUrl = `https://${host}/api/telegram/webhook`;
  
  try {
    const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      url: webhookUrl,
    });
    res.json({ success: true, message: "Webhook berhasil didaftarkan!", url: webhookUrl, telegramResponse: response.data });
  } catch (error) {
    console.error("[Set Webhook Error]", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}
