import express from 'express';
import fetch from 'node-fetch';
import https from 'https';
import dns from 'dns';
import net from 'net';
import { filterBlockedItems } from './contentFilter.js';

const router = express.Router();
const NHENTAI_API_KEY = 'nhk_XfrrpwobmaHgAhlndWpsv5hNQZI_CJIUBD7EULG0Nd9QROs3';
const ZENROWS_API_KEY = 'fd59cc48a92c0890bdf3aad5a12a0008d042f551';
const BASE_URL = 'https://nhentai.net/api/v2';

// ─── Resilient DNS-over-HTTPS (DoH) Agent to Bypass ISP DNS Hijacking ──────────
const dnsCache = new Map();

async function resolveDoH(hostname) {
  if (net.isIP(hostname)) return hostname;
  if (dnsCache.has(hostname)) return dnsCache.get(hostname);

  const dohEndpoints = [
    `https://1.1.1.1/dns-query?name=${hostname}&type=A`,
    `https://8.8.8.8/resolve?name=${hostname}&type=A`
  ];

  for (const endpoint of dohEndpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: { 'Accept': 'application/dns-json' },
        timeout: 4000
      });
      if (res.ok) {
        const json = await res.json();
        const answers = json.Answer || [];
        const aRecord = answers.find(a => a.type === 1);
        if (aRecord && aRecord.data) {
          dnsCache.set(hostname, aRecord.data);
          return aRecord.data;
        }
      }
    } catch (e) {
      // try next DoH provider
    }
  }
  return null;
}

const dohAgent = new https.Agent({
  lookup: (hostname, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    // Direct IP
    const ipVersion = net.isIP(hostname);
    if (ipVersion) {
      if (options && options.all) {
        return callback(null, [{ address: hostname, family: ipVersion }]);
      }
      return callback(null, hostname, ipVersion);
    }

    // Only apply DoH to nhentai domains to avoid any lookup loops
    if (!hostname.includes('nhentai.net')) {
      return dns.lookup(hostname, options, callback);
    }

    resolveDoH(hostname)
      .then(ip => {
        if (ip) {
          if (options && options.all) {
            return callback(null, [{ address: ip, family: 4 }]);
          }
          return callback(null, ip, 4);
        }
        dns.lookup(hostname, options, callback);
      })
      .catch(() => {
        dns.lookup(hostname, options, callback);
      });
  },
  keepAlive: true
});

// ─── Resilient Tag Cache ───────────────────────────────────────────────────────
const tagCache = new Map();

// ─── Fetch Helper with DoH & ZenRows Fallback ──────────────────────────────────
const fetchNhentai = async (endpoint) => {
  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Authorization': `Bearer ${NHENTAI_API_KEY}`,
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  };

  // 1. Primary: Direct fetch with DoH Agent (abort after 3.5s if ISP throttles/drops packets)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(url, {
      headers: defaultHeaders,
      agent: dohAgent,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    }
    console.warn(`[Nhentai DoH] Status ${response.status}, falling back to ZenRows...`);
  } catch (directErr) {
    clearTimeout(timeoutId);
    console.warn(`[Nhentai DoH] Direct failed (${directErr.name === 'AbortError' ? 'Timeout 3.5s' : directErr.message}), falling back to ZenRows...`);
  }

  // 2. Fallback: ZenRows Scraper Proxy
  try {
    const proxyUrl = `https://api.zenrows.com/v1/?apikey=${ZENROWS_API_KEY}&url=${encodeURIComponent(url)}&custom_headers=true`;
    const proxyRes = await fetch(proxyUrl, {
      headers: defaultHeaders,
      timeout: 20000
    });

    if (proxyRes.ok) {
      return await proxyRes.json();
    }
    throw new Error(`ZenRows returned ${proxyRes.status}`);
  } catch (proxyErr) {
    console.error('[Nhentai API] Both DoH and ZenRows failed:', proxyErr.message);
    throw new Error(`Nhentai API Error: ${proxyErr.message}`);
  }
};

// ─── Get List of Galleries / Search ───────────────────────────────────────────
router.get('/galleries', async (req, res) => {
  try {
    const { page = 1, query = "", sort = "" } = req.query;
    const cleanQuery = query.trim();
    
    // Nuclear code check: if query is only numbers (e.g., 177013)
    if (cleanQuery && /^\d+$/.test(cleanQuery) && !sort) {
      try {
        const data = await fetchNhentai(`/galleries/${cleanQuery}`);
        return res.json({ result: [data], num_pages: 1, per_page: 25, total: 1 });
      } catch (err) {
        // Not found as ID
        return res.json({ result: [], num_pages: 0, per_page: 25, total: 0 });
      }
    }

    let endpoint = `/galleries?page=${page}`;
    
    // If there is a query or a sort, we must use the /search endpoint
    if (cleanQuery || sort) {
      const q = encodeURIComponent(cleanQuery || '""');
      endpoint = `/search?query=${q}&page=${page}`;
      if (sort) {
        endpoint += `&sort=${sort}`;
      }
    }

    const data = await fetchNhentai(endpoint);

    // Resolve Tags for the galleries
    if (data && data.result && Array.isArray(data.result)) {
      try {
        // Find all tag IDs that are not yet in tagCache
        const missingTagIds = new Set();
        data.result.forEach(gallery => {
          if (gallery.tag_ids) {
            gallery.tag_ids.forEach(id => {
              if (!tagCache.has(id)) {
                missingTagIds.add(id);
              }
            });
          }
        });

        const missingArray = Array.from(missingTagIds);
        if (missingArray.length > 0) {
          const chunkSize = 50;
          const chunks = [];
          for (let i = 0; i < missingArray.length; i += chunkSize) {
            chunks.push(missingArray.slice(i, i + chunkSize));
          }

          const tagResults = await Promise.all(
            chunks.map(chunk =>
              fetchNhentai(`/tags/ids?ids=${chunk.join(',')}`).catch(err => {
                console.warn('[Nhentai Tags Chunk Err]:', err.message);
                return [];
              })
            )
          );

          for (const tagsResponse of tagResults) {
            if (Array.isArray(tagsResponse)) {
              tagsResponse.forEach(tag => {
                tagCache.set(tag.id, tag);
              });
            }
          }
        }

        // Attach full tags back from tagCache
        data.result = data.result.map(gallery => {
          let fullTags = gallery.tag_ids 
            ? gallery.tag_ids.map(id => tagCache.get(id)).filter(Boolean)
            : [];
          
          fullTags = fullTags.sort((a, b) => {
            const aName = (a.name || "").toLowerCase();
            const bName = (b.name || "").toLowerCase();
            const aIsNtr = aName.includes("ntr") || aName.includes("netorare");
            const bIsNtr = bName.includes("ntr") || bName.includes("netorare");
            if (aIsNtr && !bIsNtr) return -1;
            if (!aIsNtr && bIsNtr) return 1;
            return 0;
          });

          return { ...gallery, tags: fullTags };
        });

        // Filter out BL/Gay galleries
        data.result = filterBlockedItems(data.result);
      } catch (tagErr) {
        console.error('Error resolving tags:', tagErr.message);
        // Continue even if tag resolution fails
      }
    }

    if (data && data.result && Array.isArray(data.result)) {
      data.result = filterBlockedItems(data.result);
    }

    res.json(data);
  } catch (error) {
    console.error('[Nhentai API] List Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch nhentai galleries', details: error.message });
  }
});

// ─── Get Gallery Detail ────────────────────────────────────────────────────────
router.get('/galleries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchNhentai(`/galleries/${id}`);
    
    if (data && Array.isArray(data.tags)) {
      data.tags = data.tags.sort((a, b) => {
        const aName = (a.name || "").toLowerCase();
        const bName = (b.name || "").toLowerCase();
        const aIsNtr = aName.includes("ntr") || aName.includes("netorare");
        const bIsNtr = bName.includes("ntr") || bName.includes("netorare");
        if (aIsNtr && !bIsNtr) return -1;
        if (!aIsNtr && bIsNtr) return 1;
        return 0;
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('[Nhentai API] Detail Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch nhentai gallery detail', details: error.message });
  }
});

// ─── Proxy for Nhentai Images to bypass ISP blocking on client side ────────────
router.get('/image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    const defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://nhentai.net/',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    };

    // 1. Primary: Direct fetch with DoH Agent (abort after 3.5s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    try {
      const response = await fetch(url, {
        headers: defaultHeaders,
        agent: dohAgent,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        res.set('Content-Type', response.headers.get('content-type') || 'image/webp');
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        return response.body.pipe(res);
      }
    } catch (e) {
      clearTimeout(timeoutId);
    }

    // 2. Fallback: CorsProxy
    try {
      const corsUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const corsRes = await fetch(corsUrl, { headers: defaultHeaders, timeout: 15000 });
      if (corsRes.ok) {
        res.set('Content-Type', corsRes.headers.get('content-type') || 'image/webp');
        res.set('Cache-Control', 'public, max-age=86400');
        return corsRes.body.pipe(res);
      }
    } catch (e) {}

    // 3. Fallback: ZenRows Proxy
    const proxyUrl = `https://api.zenrows.com/v1/?apikey=${ZENROWS_API_KEY}&url=${encodeURIComponent(url)}`;
    const proxyRes = await fetch(proxyUrl, { timeout: 20000 });
    if (proxyRes.ok) {
      res.set('Content-Type', proxyRes.headers.get('content-type') || 'image/webp');
      res.set('Cache-Control', 'public, max-age=86400');
      return proxyRes.body.pipe(res);
    }

    res.status(502).send('Error fetching image from all sources');
  } catch (error) {
    console.error('Nhentai Image Proxy Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
