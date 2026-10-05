import axios from 'axios';
import { fetchWithDoH, dohHttpsAgent, dohHttpAgent } from './dohAgent.js';

// ScraperAPI key (optional fallback)
const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY || '';

/**
 * Fetch HTML from URL using DoH agent with fallback to ScraperAPI
 */
export async function fetchWithProxy(targetUrl, { js = false, timeout = 30000, headers: customHeaders = {} } = {}) {
  const directHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    ...customHeaders,
  };

  // Strategy 1: Direct fetch via DoH (Fastest & Free, bypasses ISP DNS poisoning)
  try {
    console.log(`[Proxy:DoH Direct] Fetching ${targetUrl}`);
    const res = await fetchWithDoH(targetUrl, {
      headers: directHeaders,
      timeout,
    });

    if (res.ok) {
      const html = await res.text();
      if (!html.includes('Just a moment') && !html.includes('cf-challenge-running')) {
        return html;
      }
      console.warn(`[Proxy:DoH Direct] Encountered Cloudflare challenge for ${targetUrl}`);
    } else {
      console.warn(`[Proxy:DoH Direct] HTTP ${res.status} for ${targetUrl}`);
    }
  } catch (err) {
    console.warn(`[Proxy:DoH Direct] Failed for ${targetUrl}:`, err.message);
  }

  // Strategy 2: ScraperAPI (if key provided)
  if (SCRAPERAPI_KEY) {
    try {
      const params = new URLSearchParams({ api_key: SCRAPERAPI_KEY, url: targetUrl });
      if (js) params.set('render', 'true');
      const scraperUrl = `http://api.scraperapi.com/?${params.toString()}`;
      console.log(`[Proxy:ScraperAPI] Fetching ${targetUrl}`);
      const r = await axios.get(scraperUrl, { timeout: 45000, headers: directHeaders });
      if (r.status === 200 && r.data) {
        return typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
      }
    } catch (e) {
      console.warn(`[Proxy:ScraperAPI] Failed: ${e.response?.status || e.message?.slice(0, 60)}`);
    }
  }

  throw new Error(`Gagal mengambil data dari ${targetUrl}. Server mungkin sedang offline atau diblokir.`);
}

/**
 * Fetch JSON from API URL using DoH agent with fallback
 */
export async function fetchJsonWithProxy(targetUrl, { timeout = 25000, headers: customHeaders = {} } = {}) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    ...customHeaders,
  };

  // Strategy 1: Direct fetch via DoH
  try {
    console.log(`[Proxy:DoH JSON] Fetching ${targetUrl}`);
    const res = await fetchWithDoH(targetUrl, {
      headers,
      timeout,
    });

    if (res.ok) {
      return await res.json();
    }
    console.warn(`[Proxy:DoH JSON] HTTP ${res.status} for ${targetUrl}`);
  } catch (err) {
    console.warn(`[Proxy:DoH JSON] Failed for ${targetUrl}:`, err.message);
  }

  // Strategy 2: ScraperAPI
  if (SCRAPERAPI_KEY) {
    try {
      const scraperUrl = `http://api.scraperapi.com/?api_key=${SCRAPERAPI_KEY}&url=${encodeURIComponent(targetUrl)}`;
      console.log(`[Proxy:ScraperAPI JSON] Fetching ${targetUrl}`);
      const r = await axios.get(scraperUrl, { timeout: 35000, headers });
      if (r.status === 200 && r.data) {
        return typeof r.data === 'object' ? r.data : JSON.parse(r.data);
      }
    } catch (e) {
      console.warn(`[Proxy:ScraperAPI JSON] Failed: ${e.message?.slice(0, 80)}`);
    }
  }

  throw new Error(`Gagal fetch JSON dari ${targetUrl}.`);
}
