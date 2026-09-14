import axios from 'axios';

const GOOGLE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY;

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

  const folderId = extractFolderId(folderLinkOrId);

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
      stream_url: `https://drive.google.com/file/d/${file.id}/preview`,
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
