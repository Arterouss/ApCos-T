/**
 * Download Helper Utility for ApiCos
 * Handles direct blob downloads, CORS proxy fallbacks, filename sanitization,
 * and JSON export/import for favorites.
 */

/**
 * Extract the best downloadable URL from a favorite/media item
 */
export function getDownloadableUrl(item) {
  if (!item) return null;
  return (
    item.file_url ||
    item.media_url ||
    item.download_url ||
    item.video_url ||
    item.sample_url ||
    item.preview_url ||
    item.cover_url ||
    item.thumbnail ||
    item.poster ||
    null
  );
}

/**
 * Sanitize filename and extract appropriate extension
 */
export function getSafeFilename(title, mediaUrl, type = "") {
  let cleanTitle = (title || "apicos_media")
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .trim()
    .slice(0, 60);

  if (!cleanTitle) cleanTitle = `apicos_${Date.now()}`;

  // Check if title already ends with a known media extension
  const hasExt = /\.(jpe?g|png|gif|webp|mp4|webm|mkv|zip)$/i.test(cleanTitle);
  if (hasExt) {
    return cleanTitle;
  }

  // Detect extension from URL
  let ext = ".jpg";
  if (mediaUrl) {
    try {
      const parsed = new URL(mediaUrl, window.location.origin);
      const match = parsed.pathname.match(/\.([a-zA-Z0-9]{3,4})(?:$|\?)/i);
      if (match && match[1]) {
        const foundExt = match[1].toLowerCase();
        if (
          ["jpg", "jpeg", "png", "gif", "webp", "mp4", "webm", "mkv", "zip"].includes(
            foundExt
          )
        ) {
          ext = `.${foundExt}`;
        }
      }
    } catch {
      // Ignore URL parse error
    }
  }

  // If extension is still default, check item type
  if (ext === ".jpg") {
    const t = String(type).toLowerCase();
    if (
      t.includes("video") ||
      t.includes("jav") ||
      t.includes("hentai") ||
      t.includes("anime") ||
      t.includes("cinema")
    ) {
      ext = ".mp4";
    }
  }

  return `${cleanTitle}${ext}`;
}

/**
 * Triggers a browser download using an in-memory Blob
 */
export function triggerBlobDownload(blob, filename) {
  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      // Ignore cleanup error
    }
  }, 2000);
}

/**
 * Triggers a direct anchor download via proxy attachment header
 */
export function triggerDirectDownload(url, filename) {
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
    } catch {
      // Ignore cleanup error
    }
  }, 2000);
}

/**
 * Main download function
 * Tries direct fetch -> CORS Proxy fetch -> Direct Proxy Content-Disposition link
 */
export async function downloadMedia(url, filename, options = {}) {
  if (!url) {
    throw new Error("URL berkas tidak ditemukan.");
  }

  const { referer } = options;
  const safeFilename = filename || getSafeFilename("download", url);

  // Strategy 1: Direct fetch with no-referrer
  try {
    const res = await fetch(url, {
      referrerPolicy: "no-referrer",
      mode: "cors",
    });
    if (res.ok) {
      const blob = await res.blob();
      if (blob && blob.size > 0) {
        triggerBlobDownload(blob, safeFilename);
        return { success: true, method: "direct_blob" };
      }
    }
  } catch (err) {
    console.warn("[DownloadHelper] Direct fetch blocked by CORS/network, using proxy:", err.message);
  }

  // Strategy 2: Proxy fetch with download=1
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}${
    referer ? `&referer=${encodeURIComponent(referer)}` : ""
  }&download=1&filename=${encodeURIComponent(safeFilename)}`;

  try {
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const blob = await res.blob();
      if (blob && blob.size > 0) {
        triggerBlobDownload(blob, safeFilename);
        return { success: true, method: "proxy_blob" };
      }
    }
  } catch (err) {
    console.warn("[DownloadHelper] Proxy fetch failed, triggering direct attachment link:", err.message);
  }

  // Strategy 3: Direct navigation via proxy attachment header
  try {
    triggerDirectDownload(proxyUrl, safeFilename);
    return { success: true, method: "proxy_attachment" };
  } catch (err) {
    // Strategy 4: Direct fallback to raw URL
    triggerDirectDownload(url, safeFilename);
    return { success: true, method: "raw_fallback" };
  }
}

/**
 * Export full favorites list as a JSON backup file
 */
export function exportFavoritesAsJson(favorites) {
  if (!favorites || favorites.length === 0) {
    throw new Error("Daftar favorit kosong, tidak ada yang dapat diekspor.");
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `apicos_favorites_backup_${dateStr}.json`;
  const jsonStr = JSON.stringify(favorites, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });

  triggerBlobDownload(blob, filename);
  return { success: true, count: favorites.length, filename };
}

/**
 * Import and merge favorites from a JSON file
 */
export function importFavoritesFromJson(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("Tidak ada berkas yang dipilih."));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!Array.isArray(parsed)) {
          return reject(new Error("Format berkas tidak valid: harus berupa array JSON."));
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error("Gagal membaca berkas JSON: " + err.message));
      }
    };
    reader.onerror = () => reject(new Error("Gagal membuka berkas."));
    reader.readAsText(file);
  });
}
