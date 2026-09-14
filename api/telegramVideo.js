import axios from 'axios';

// Gunakan Environment Variable atau hardcode sementara
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "GANTI_DENGAN_TOKEN_BOT_ANDA";
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "GANTI_DENGAN_ID_CHANNEL_ANDA";

/**
 * Mengambil daftar pesan dari Channel Telegram.
 * Channel harus bersifat Publik atau Bot harus menjadi admin di Channel Private.
 */
export async function getTelegramVideos() {
  if (BOT_TOKEN === "GANTI_DENGAN_TOKEN_BOT_ANDA" || CHANNEL_ID === "GANTI_DENGAN_ID_CHANNEL_ANDA") {
    throw new Error("Telegram Bot Token atau Channel ID belum diatur!");
  }

  try {
    // Kita mengambil update terbaru dari bot.
    // Catatan: getUpdates hanya berfungsi jika Webhook tidak aktif dan pesan dikirim baru-baru ini.
    // Jika Anda ingin mengambil dari history channel private secara spesifik, 
    // Anda bisa mem-forward pesan ke bot dan bot menyimpannya ke database, atau menggunakan MTProto.
    // Untuk versi simpel, kita gunakan getUpdates untuk melihat file yang dikirim ke Bot secara langsung (bukan channel).
    // Jadi user cukup mengirim video (.mp4) ke chat pribadi bot.
    
    const response = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`);
    
    if (!response.data.ok) {
      throw new Error("Gagal mengambil data dari Telegram");
    }

    const messages = response.data.result;
    const videos = [];

    for (const msg of messages) {
      const message = msg.message || msg.channel_post;
      if (message && message.video) {
        // Dapatkan path file video
        const fileRes = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${message.video.file_id}`);
        
        if (fileRes.data.ok) {
          const filePath = fileRes.data.result.file_path;
          const videoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
          
          videos.push({
            id: message.message_id,
            title: message.caption || `Video Pribadi ${message.message_id}`,
            video_url: videoUrl,
            thumbnail: message.video.thumbnail ? `https://api.telegram.org/file/bot${BOT_TOKEN}/${message.video.thumbnail.file_path}` : null,
            date: new Date(message.date * 1000).toISOString(),
            duration: message.video.duration
          });
        }
      }
    }

    // Urutkan dari yang terbaru
    return videos.sort((a, b) => new Date(b.date) - new Date(a.date));

  } catch (error) {
    console.error("[Telegram Video] Error:", error.message);
    throw error;
  }
}
