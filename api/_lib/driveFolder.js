import axios from 'axios';
import { connectDB } from './telegramDb.js';

const GOOGLE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY;

/**
 * Mengambil daftar link Google Drive folder yang tersimpan di MongoDB atau env.
 * Mengembalikan array of string link folder.
 */
export async function getSavedDriveFolderLinks() {
  try {
    const db = await connectDB();
    const doc = await db.collection("settings").findOne({ key: "drive_folder_links" });
    if (doc && Array.isArray(doc.value) && doc.value.length > 0) {
      return doc.value.filter(l => typeof l === 'string' && l.trim());
    }

    // Fallback ke key single lama "drive_folder_link"
    const legacyDoc = await db.collection("settings").findOne({ key: "drive_folder_link" });
    if (legacyDoc && legacyDoc.value) {
      return [legacyDoc.value.trim()];
    }
  } catch (err) {
    console.error("Gagal membaca link Drive dari MongoDB:", err.message);
  }

  if (process.env.GOOGLE_DRIVE_FOLDER_LINK) {
    return [process.env.GOOGLE_DRIVE_FOLDER_LINK.trim()];
  }

  return [];
}

/**
 * Backward-compatible helper untuk mendapatkan 1 link utama
 */
export async function getSavedDriveFolderLink() {
  const links = await getSavedDriveFolderLinks();
  return links[0] || "";
}

/**
 * Menyimpan daftar link Google Drive folder ke MongoDB settings.
 */
export async function saveDriveFolderLinks(links) {
  if (!Array.isArray(links)) {
    links = [links];
  }

  // Bersihkan dan validasi setiap link
  const validLinks = [];
  const seenIds = new Set();

  for (const rawLink of links) {
    if (!rawLink || typeof rawLink !== 'string') continue;
    const cleanLink = rawLink.trim();
    if (!cleanLink) continue;

    try {
      const folderId = extractFolderId(cleanLink);
      if (!seenIds.has(folderId)) {
        seenIds.add(folderId);
        validLinks.push(cleanLink);
      }
    } catch (e) {
      console.warn(`[Drive Config] Mengabaikan link tidak valid (${cleanLink}):`, e.message);
    }
  }

  if (validLinks.length === 0) {
    throw new Error('Tidak ada link folder Google Drive yang valid.');
  }

  const db = await connectDB();
  await db.collection("settings").updateOne(
    { key: "drive_folder_links" },
    { $set: { key: "drive_folder_links", value: validLinks, updatedAt: new Date() } },
    { upsert: true }
  );

  // Simpan juga ke key legacy untuk backward compatibility
  await db.collection("settings").updateOne(
    { key: "drive_folder_link" },
    { $set: { key: "drive_folder_link", value: validLinks[0], updatedAt: new Date() } },
    { upsert: true }
  );

  return validLinks;
}

/**
 * Menambahkan 1 link folder baru ke daftar yang sudah ada
 */
export async function addDriveFolderLink(newLink) {
  if (!newLink || typeof newLink !== 'string' || !newLink.trim()) {
    throw new Error('Link folder Google Drive tidak boleh kosong.');
  }

  const clean = newLink.trim();
  extractFolderId(clean); // validasi format

  const existing = await getSavedDriveFolderLinks();
  const updated = [...existing, clean];
  return await saveDriveFolderLinks(updated);
}

/**
 * Menghapus 1 link folder tertentu atau semua folder jika link tidak diberikan
 */
export async function deleteDriveFolderLink(linkToDelete) {
  const db = await connectDB();
  if (!linkToDelete) {
    await db.collection("settings").deleteOne({ key: "drive_folder_links" });
    await db.collection("settings").deleteOne({ key: "drive_folder_link" });
    return [];
  }

  const existing = await getSavedDriveFolderLinks();
  const folderIdToDelete = (() => {
    try { return extractFolderId(linkToDelete.trim()); } catch { return linkToDelete.trim(); }
  })();

  const filtered = existing.filter(l => {
    try {
      return extractFolderId(l) !== folderIdToDelete;
    } catch {
      return l !== linkToDelete;
    }
  });

  if (filtered.length === 0) {
    await db.collection("settings").deleteOne({ key: "drive_folder_links" });
    await db.collection("settings").deleteOne({ key: "drive_folder_link" });
    return [];
  }

  return await saveDriveFolderLinks(filtered);
}

/**
 * Backward-compatible: simpan 1 link
 */
export async function saveDriveFolderLink(link) {
  const res = await saveDriveFolderLinks([link]);
  return res[0];
}

/**
 * Mengekstrak Folder ID dari berbagai format link Google Drive.
 * Contoh input: https://drive.google.com/drive/folders/1abc123XYZ?usp=sharing
 * Contoh output: 1abc123XYZ
 */
export function extractFolderId(linkOrId) {
  if (!linkOrId || typeof linkOrId !== 'string') {
    throw new Error('Link folder tidak valid.');
  }
  const str = linkOrId.trim();

  // Kalau sudah berupa ID murni (tidak ada "https")
  if (!str.includes('http')) return str;

  // Format link folder drive: /folders/ID
  const folderMatch = str.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];

  // Format link parameter: ?id=ID
  const queryMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryMatch) return queryMatch[1];

  throw new Error('Format link Google Drive tidak dikenali. Gunakan link dari "Bagikan Folder".');
}

/**
 * Mengambil daftar file video dari satu folder Google Drive tertentu
 */
async function fetchVideosFromSingleFolder(folderId, driveIndex) {
  const query = `'${folderId}' in parents and mimeType contains 'video/' and trashed = false`;
  const fields = 'files(id,name,mimeType,thumbnailLink,createdTime,size,videoMediaMetadata)';

  const response = await axios.get('https://www.googleapis.com/drive/v3/files', {
    params: {
      q: query,
      fields: fields,
      orderBy: 'createdTime desc',
      key: GOOGLE_API_KEY,
      pageSize: 100,
    },
    timeout: 15000
  });

  const files = response.data.files || [];

  return files.map(file => ({
    id: file.id,
    title: file.name.replace(/\.[^/.]+$/, ''), // Hilangkan ekstensi
    filename: file.name,
    thumbnail: file.thumbnailLink?.replace('=s220', '=s400') || null,
    preview_url: `https://drive.google.com/file/d/${file.id}/preview`,
    embed_url: `https://drive.google.com/file/d/${file.id}/preview`,
    stream_url: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${GOOGLE_API_KEY}`,
    download_url: `https://drive.google.com/uc?export=download&id=${file.id}`,
    date: file.createdTime,
    size: file.size ? Math.round(parseInt(file.size) / (1024 * 1024)) + ' MB' : null,
    duration: file.videoMediaMetadata?.durationMillis 
      ? formatDuration(parseInt(file.videoMediaMetadata.durationMillis))
      : null,
    folderId: folderId,
    driveIndex: driveIndex, // 1, 2, 3...
    driveLabel: `Drive ${driveIndex}`
  }));
}

/**
 * Mengambil daftar file video dari satu ATAU banyak folder Google Drive sekaligus.
 * Menggabungkan hasilnya dan mengurutkannya dari yang terbaru.
 */
export async function getDriveVideos(targetInput) {
  if (!GOOGLE_API_KEY) {
    throw new Error("API_KEY_NOT_SET: GOOGLE_DRIVE_API_KEY belum diatur di Environment Variables!");
  }

  // Tentukan daftar target folder link
  let targets = [];
  if (Array.isArray(targetInput)) {
    targets = targetInput;
  } else if (typeof targetInput === 'string' && targetInput.trim()) {
    // Bisa dipisah koma atau newline
    targets = targetInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  } else {
    targets = await getSavedDriveFolderLinks();
  }

  if (!targets || targets.length === 0) {
    throw new Error('Link folder Google Drive belum diatur. Silakan masukkan link folder terlebih dahulu.');
  }

  // Parse folder IDs
  const parsedFolders = [];
  targets.forEach((t, idx) => {
    try {
      const fid = extractFolderId(t);
      if (!parsedFolders.some(p => p.folderId === fid)) {
        parsedFolders.push({ folderId: fid, originalLink: t, index: parsedFolders.length + 1 });
      }
    } catch (err) {
      console.warn(`[Drive] Gagal parse target folder #${idx + 1}: ${t}`);
    }
  });

  if (parsedFolders.length === 0) {
    throw new Error('Tidak ada link folder Google Drive yang valid.');
  }

  // Fetch dari semua folder secara paralel dengan Promise.allSettled agar tidak gagal total jika salah satu bermasalah
  const results = await Promise.allSettled(
    parsedFolders.map(f => fetchVideosFromSingleFolder(f.folderId, f.index))
  );

  const mergedVideos = [];
  const folderStats = [];
  const seenVideoIds = new Set();

  results.forEach((res, i) => {
    const folderInfo = parsedFolders[i];
    if (res.status === 'fulfilled') {
      const videos = res.value || [];
      folderStats.push({
        folderId: folderInfo.folderId,
        driveIndex: folderInfo.index,
        driveLabel: `Drive ${folderInfo.index}`,
        originalLink: folderInfo.originalLink,
        count: videos.length,
        status: 'ok'
      });

      videos.forEach(v => {
        if (!seenVideoIds.has(v.id)) {
          seenVideoIds.add(v.id);
          mergedVideos.push(v);
        }
      });
    } else {
      console.error(`[Drive] Error folder #${folderInfo.index} (${folderInfo.folderId}):`, res.reason?.message);
      folderStats.push({
        folderId: folderInfo.folderId,
        driveIndex: folderInfo.index,
        driveLabel: `Drive ${folderInfo.index}`,
        originalLink: folderInfo.originalLink,
        count: 0,
        status: 'error',
        error: res.reason?.message || 'Gagal memuat'
      });
    }
  });

  // Urutkan semua video dari yang paling baru
  mergedVideos.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return {
    videos: mergedVideos,
    totalFolders: parsedFolders.length,
    folderStats: folderStats
  };
}

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
