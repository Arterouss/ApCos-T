import axios from 'axios';
import { connectDB } from './telegramDb.js';

const GOOGLE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY;

/**
 * Mengambil link Google Drive folder yang tersimpan di MongoDB atau env.
 */
export async function getSavedDriveFolderLink() {
  try {
    const db = await connectDB();
    const doc = await db.collection("settings").findOne({ key: "drive_folder_link" });
    if (doc && doc.value) {
      return doc.value;
    }
  } catch (err) {
    console.error("Gagal membaca link Drive dari MongoDB:", err.message);
  }

  if (process.env.GOOGLE_DRIVE_FOLDER_LINK) {
    return process.env.GOOGLE_DRIVE_FOLDER_LINK;
  }

  return "";
}

/**
 * Menyimpan link Google Drive folder ke MongoDB settings agar permanen.
 */
export async function saveDriveFolderLink(link) {
  if (!link || typeof link !== 'string' || !link.trim()) {
    throw new Error('Link folder Google Drive tidak boleh kosong.');
  }

  const cleanLink = link.trim();
  // Validasi format link / folder ID
  extractFolderId(cleanLink);

  const db = await connectDB();
  await db.collection("settings").updateOne(
    { key: "drive_folder_link" },
    { $set: { key: "drive_folder_link", value: cleanLink, updatedAt: new Date() } },
    { upsert: true }
  );

  return cleanLink;
}

/**
 * Menghapus link Google Drive folder dari database.
 */
export async function deleteDriveFolderLink() {
  const db = await connectDB();
  await db.collection("settings").deleteOne({ key: "drive_folder_link" });
  return true;
}

/**
 * Mengekstrak Folder ID dari berbagai format link Google Drive.
 * Contoh input: https://drive.google.com/drive/folders/1abc123XYZ?usp=sharing
 * Contoh output: 1abc123XYZ
 */
function extractFolderId(linkOrId) {
  // Kalau sudah berupa ID murni (tidak ada "https")
  if (!linkOrId.includes('http')) return linkOrId.trim();

  // Coba ekstrak dari format link folder drive
  const folderMatch = linkOrId.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];

  // Coba format lain: ?id=xxxxx
  const queryMatch = linkOrId.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryMatch) return queryMatch[1];

  throw new Error('Format link Google Drive tidak dikenali. Gunakan link dari "Bagikan Folder".');
}

/**
 * Mengambil daftar file video dari sebuah folder Google Drive.
 * Folder harus bersifat PUBLIK ("Anyone with the link" = Viewer).
 */
export async function getDriveVideos(folderLinkOrId) {
  if (!GOOGLE_API_KEY) {
    throw new Error("API_KEY_NOT_SET: GOOGLE_DRIVE_API_KEY belum diatur di Environment Variables!");
  }

  let target = folderLinkOrId;
  if (!target) {
    target = await getSavedDriveFolderLink();
  }

  if (!target) {
    throw new Error('Link folder Google Drive belum diatur. Silakan masukkan link folder terlebih dahulu.');
  }

  const folderId = extractFolderId(target);

  // Query ke Google Drive API v3: ambil semua file video di dalam folder
  const query = `'${folderId}' in parents and mimeType contains 'video/' and trashed = false`;
  const fields = 'files(id,name,mimeType,thumbnailLink,createdTime,size,videoMediaMetadata)';

  try {
    const response = await axios.get('https://www.googleapis.com/drive/v3/files', {
      params: {
        q: query,
        fields: fields,
        orderBy: 'createdTime desc',
        key: GOOGLE_API_KEY,
        pageSize: 100,
      }
    });

    const files = response.data.files || [];

    return files.map(file => ({
      id: file.id,
      title: file.name.replace(/\.[^/.]+$/, ''), // Hilangkan ekstensi
      filename: file.name,
      thumbnail: file.thumbnailLink?.replace('=s220', '=s400') || null,
      stream_url: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${GOOGLE_API_KEY}`,
      download_url: `https://drive.google.com/uc?export=download&id=${file.id}`,
      date: file.createdTime,
      size: file.size ? Math.round(parseInt(file.size) / (1024 * 1024)) + ' MB' : null,
      duration: file.videoMediaMetadata?.durationMillis 
        ? formatDuration(parseInt(file.videoMediaMetadata.durationMillis))
        : null,
    }));

  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('Akses ditolak. Pastikan folder Google Drive Anda sudah di-set ke "Anyone with the link can view".');
    }
    if (error.response?.status === 404) {
      throw new Error('Folder tidak ditemukan. Periksa kembali link folder Anda.');
    }
    throw new Error(`Gagal mengambil data dari Google Drive: ${error.message}`);
  }
}

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
