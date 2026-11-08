import { connectDB } from './telegramDb.js';
import axios from 'axios';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Track recently replied media groups to avoid spamming replies for albums
const repliedGroups = new Set();

/**
 * Endpoint webhook untuk menerima update instan dari Telegram
 */
export async function handleTelegramWebhook(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!BOT_TOKEN) {
    console.warn("[Webhook] TELEGRAM_BOT_TOKEN is not configured");
    return res.status(200).send("OK");
  }

  const update = req.body;
  if (!update) {
    return res.status(400).json({ error: 'Bad Request' });
  }

  const message = update.message || update.channel_post;
  if (!message) {
    return res.status(200).send('OK');
  }

  // Tangani perintah teks /start atau /help
  if (message.text && (message.text.startsWith('/start') || message.text.startsWith('/help'))) {
    try {
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: message.chat.id,
        text: `📸 *Selamat datang di Bot ApiCos Photo Vault!*\n\nKirimkan foto langsung ke chat ini untuk otomatis menyimpannya ke galeri web ApiCos Anda.\n\n💡 *Tips Penggunaan:*\n• Kirim langsung di chat pribadi (DM) dengan bot ini.\n• Anda bisa menambahkan hashtag kategori di caption:\n  \`#MyGoon\`, \`#Cosplay\`, atau \`#Gravure\`\n• Mendukung pengiriman foto biasa maupun album.\n• Buka halaman *Foto Pribadi* di web ApiCos lalu tekan *Refresh Vault* untuk melihat foto baru!`,
        parse_mode: 'Markdown',
      });
    } catch (e) {
      console.warn('[Telegram Webhook] Failed to send welcome message:', e.message);
    }
    return res.status(200).send('OK');
  }

  // Ekstrak file foto atau dokumen gambar
  let fileId = null;
  let width = 800;
  let height = 600;

  if (message.photo && message.photo.length > 0) {
    const largestPhoto = message.photo[message.photo.length - 1];
    fileId = largestPhoto.file_id;
    width = largestPhoto.width || 800;
    height = largestPhoto.height || 600;
  } else if (
    message.document &&
    (message.document.mime_type?.startsWith("image/") ||
      /\.(jpe?g|png|webp|gif|bmp)$/i.test(message.document.file_name || ""))
  ) {
    fileId = message.document.file_id;
    width = message.document.thumbnail?.width || 800;
    height = message.document.thumbnail?.height || 600;
  }

  // Jika pesan bukan gambar/foto, abaikan
  if (!fileId) {
    return res.status(200).send('OK');
  }

  try {
    const db = await connectDB();
    const collection = db.collection("telegram_photos");

    const id = `${message.chat.id}_${message.message_id}`;

    const newPhoto = {
      id:         id,
      message_id: message.message_id,
      chat_id:    message.chat.id,
      file_id:    fileId,
      width:      width,
      height:     height,
      caption:    message.caption || null,
      group_id:   message.media_group_id || null,
      date:       new Date(message.date * 1000).toISOString(),
      deleted:    false,
    };

    // Ambil URL file dari Telegram API
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

      // Kirim konfirmasi pesan balik ke Telegram agar user tahu foto telah diterima
      try {
        let shouldReply = true;
        if (newPhoto.group_id) {
          if (repliedGroups.has(newPhoto.group_id)) {
            shouldReply = false;
          } else {
            repliedGroups.add(newPhoto.group_id);
            // Bersihkan setelah 1 menit
            setTimeout(() => repliedGroups.delete(newPhoto.group_id), 60000);
          }
        }

        if (shouldReply && message.chat?.id) {
          const catInfo = newPhoto.caption ? `\n🏷️ Caption: \`${newPhoto.caption}\`` : '';
          await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: message.chat.id,
            reply_to_message_id: message.message_id,
            text: `✅ *Foto berhasil disimpan ke ApiCos!*${catInfo}\n\nSilakan buka menu *Foto Pribadi* di web lalu klik *Refresh Vault* untuk melihat foto Anda.`,
            parse_mode: 'Markdown',
          });
        }
      } catch (replyErr) {
        console.warn("[Telegram Webhook Reply]", replyErr.message);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error("[Webhook Error]", error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Mendaftarkan Webhook Telegram ke URL domain saat ini
 */
export async function setTelegramWebhook(req, res) {
  if (!BOT_TOKEN) {
    return res.status(500).json({ success: false, error: "TELEGRAM_BOT_TOKEN is not configured" });
  }
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
