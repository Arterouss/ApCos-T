import { fetchWithDoH } from './dohAgent.js';
import { filterBlockedItems } from './contentFilter.js';

const BASE = 'https://coomer.st';
const IMG_BASE = 'https://img.coomer.st';

export const COOMER_SERVICES = ['onlyfans', 'fansly', 'candfans', 'fansone', 'patreon'];

// In-memory cache for creators list (refreshed every hour)
let creatorsCache = null;
let creatorsCacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch all creators with caching
 */
async function fetchAllCreators() {
  const now = Date.now();
  if (creatorsCache && (now - creatorsCacheTime) < CACHE_TTL_MS) {
    return creatorsCache;
  }

  console.log('[Coomer] Fetching full creators list from coomer.st...');
  try {
    const res = await fetchWithDoH(`${BASE}/api/v1/creators`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/css',
        'Referer': `${BASE}/`,
      },
      timeout: 30000,
    });

    if (!res.ok) {
      throw new Error(`Coomer API error HTTP ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      creatorsCache = data;
      creatorsCacheTime = now;
      console.log(`[Coomer] Cached ${data.length} creators successfully.`);
      return data;
    }
    return creatorsCache || [];
  } catch (err) {
    console.warn('[Coomer] Failed to fetch creators list:', err.message);
    if (creatorsCache) return creatorsCache;
    throw err;
  }
}

/**
 * Ambil daftar creator dari Coomer
 * Mendukung filter service, search query, dan pagination lokal yang cepat
 */
export async function getCoomerCreators({ service = '', offset = 0, limit = 40, search = '' } = {}) {
  const all = await fetchAllCreators();

  let filtered = all;

  // Filter service
  if (service && service !== 'all') {
    const sLower = service.toLowerCase();
    filtered = filtered.filter(c => (c.service || '').toLowerCase() === sLower);
  }

  // Filter search
  if (search) {
    const qLower = search.toLowerCase().trim();
    filtered = filtered.filter(c =>
      (c.name && c.name.toLowerCase().includes(qLower)) ||
      (c.id && c.id.toLowerCase().includes(qLower))
    );
  }

  // Sort by favorited count or updated date
  filtered.sort((a, b) => (b.favorited || 0) - (a.favorited || 0) || (b.updated || 0) - (a.updated || 0));

  const total = filtered.length;
  const paged = filtered.slice(offset, offset + limit);

  const creators = paged.map(c => ({
    id: c.id,
    name: c.name || c.id,
    service: c.service,
    indexed: c.indexed,
    updated: c.updated,
    favorited: c.favorited || 0,
    avatar: `/api/coomer/media?icon=1&service=${encodeURIComponent(c.service)}&id=${encodeURIComponent(c.id)}`,
    url: `${BASE}/${c.service}/user/${c.id}`,
  }));

  return {
    creators,
    total,
    offset,
    limit,
    hasMore: offset + limit < total,
  };
}

/**
 * Map file path to proxy URL
 */
function buildProxyMediaUrl(path) {
  if (!path) return null;
  return `/api/coomer/media?path=${encodeURIComponent(path)}`;
}

/**
 * Map raw post object
 */
function mapPost(p) {
  const files = Array.isArray(p.attachments) ? [...p.attachments] : [];
  if (p.file && p.file.path) files.unshift(p.file);

  const images = [];
  const videos = [];

  for (const f of files) {
    if (!f || !f.path) continue;
    const mediaUrl = buildProxyMediaUrl(f.path);
    const directUrl = `${IMG_BASE}/thumbnail/data${f.path}`;
    const ext = (f.path || f.name || '').split('.').pop()?.toLowerCase();
    const isVid = ['mp4', 'webm', 'mov', 'avi', 'm4v'].includes(ext);

    if (isVid) {
      videos.push({
        url: mediaUrl,
        direct_url: directUrl,
        name: f.name || 'video',
        path: f.path,
      });
    } else {
      images.push({
        url: mediaUrl,
        direct_url: directUrl,
        name: f.name || 'image',
        path: f.path,
      });
    }
  }

  // First image or thumbnail
  const firstMediaPath = files[0]?.path;
  const thumbnail = firstMediaPath ? buildProxyMediaUrl(firstMediaPath) : null;

  return {
    id: p.id,
    service: p.service,
    user: p.user,
    title: p.title || '',
    content: p.content || p.substring || '',
    published: p.published,
    added: p.added,
    thumbnail,
    images,
    videos,
    has_video: videos.length > 0,
    has_images: images.length > 0,
    media_count: files.length,
    creator_url: `${BASE}/${p.service}/user/${p.user}`,
    post_url: `${BASE}/${p.service}/user/${p.user}/post/${p.id}`,
  };
}

/**
 * Ambil daftar posts feed terbaru dari Coomer
 */
export async function getCoomerRecentPosts({ offset = 0 } = {}) {
  const url = `${BASE}/api/v1/posts?o=${offset}`;
  const res = await fetchWithDoH(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/css',
      'Referer': `${BASE}/`,
    },
    timeout: 20000,
  });

  if (!res.ok) {
    throw new Error(`Gagal memuat feed Coomer HTTP ${res.status}`);
  }

  const data = await res.json();
  const rawPosts = Array.isArray(data) ? data : (data.posts || []);
  const posts = rawPosts.map(mapPost);

  return {
    posts: filterBlockedItems(posts),
    offset,
    total: data.count || data.true_count || posts.length,
  };
}

/**
 * Ambil posts dari creator tertentu
 */
export async function getCoomerCreatorPosts({ service, creatorId, offset = 0 } = {}) {
  const url = `${BASE}/api/v1/${service}/user/${creatorId}/posts?o=${offset}`;
  const res = await fetchWithDoH(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/css',
      'Referer': `${BASE}/`,
    },
    timeout: 20000,
  });

  if (!res.ok) {
    throw new Error(`Gagal memuat postingan creator HTTP ${res.status}`);
  }

  const data = await res.json();
  const rawPosts = Array.isArray(data) ? data : (data.posts || []);
  const posts = rawPosts.map(mapPost);

  return {
    posts: filterBlockedItems(posts),
    offset,
    hasMore: rawPosts.length >= 25,
  };
}

/**
 * Ambil profile creator
 */
export async function getCoomerCreatorProfile({ service, creatorId } = {}) {
  const all = await fetchAllCreators().catch(() => []);
  const found = all.find(c => c.service === service && c.id === creatorId);

  return {
    id: creatorId,
    name: found?.name || creatorId,
    service,
    favorited: found?.favorited || 0,
    avatar: `/api/coomer/media?icon=1&service=${encodeURIComponent(service)}&id=${encodeURIComponent(creatorId)}`,
    url: `${BASE}/${service}/user/${creatorId}`,
    indexed: found?.indexed,
    updated: found?.updated,
  };
}
