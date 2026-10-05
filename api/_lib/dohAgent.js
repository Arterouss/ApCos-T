import https from 'https';
import http from 'http';
import dns from 'dns';
import fetch from 'node-fetch';

/**
 * Known IP cache for domains frequently poisoned by Indonesian ISPs (Indosat, Telkomsel, XL, etc.)
 */
const DNS_CACHE = new Map([
  ['hentaiplay.net', ['104.21.86.178', '172.67.223.77']],
  ['porn3dx.com', ['104.21.65.234', '172.67.194.67']],
  ['m.porn3dx.com', ['104.21.65.234', '172.67.194.67']],
  ['coomer.st', ['190.115.31.237']],
  ['img.coomer.st', ['190.115.31.237']],
  ['hentaiplanet.info', ['162.55.134.42']],
]);

/**
 * Resolve hostname using DNS-over-HTTPS (DoH) via Google or Cloudflare
 */
export async function resolveDoH(hostname) {
  if (DNS_CACHE.has(hostname)) {
    const cached = DNS_CACHE.get(hostname);
    if (cached && cached.length > 0) return cached[0];
  }

  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`, {
      timeout: 5000,
    });
    const json = await res.json();
    if (json.Answer && json.Answer.length > 0) {
      const ips = json.Answer.filter(a => a.type === 1).map(a => a.data);
      if (ips.length > 0) {
        DNS_CACHE.set(hostname, ips);
        console.log(`[DoH] Resolved ${hostname} -> ${ips[0]}`);
        return ips[0];
      }
    }
  } catch (err) {
    console.warn(`[DoH] Google DoH failed for ${hostname}:`, err.message);
  }

  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`, {
      headers: { accept: 'application/dns-json' },
      timeout: 5000,
    });
    const json = await res.json();
    if (json.Answer && json.Answer.length > 0) {
      const ips = json.Answer.filter(a => a.type === 1).map(a => a.data);
      if (ips.length > 0) {
        DNS_CACHE.set(hostname, ips);
        console.log(`[DoH] CF Resolved ${hostname} -> ${ips[0]}`);
        return ips[0];
      }
    }
  } catch (err) {
    console.warn(`[DoH] Cloudflare DoH failed for ${hostname}:`, err.message);
  }

  return null;
}

/**
 * Custom lookup function that intercepts hostname lookups and resolves via DoH
 */
function dohLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  // 1. Check synchronous cache
  if (DNS_CACHE.has(hostname)) {
    const ips = DNS_CACHE.get(hostname);
    const ip = ips[0];
    if (options && options.all) {
      return callback(null, ips.map(addr => ({ address: addr, family: 4 })));
    }
    return callback(null, ip, 4);
  }

  // 2. Resolve asynchronously via DoH
  resolveDoH(hostname)
    .then(ip => {
      if (ip) {
        if (options && options.all) {
          return callback(null, [{ address: ip, family: 4 }]);
        }
        return callback(null, ip, 4);
      }
      // 3. Fallback to normal system DNS
      dns.lookup(hostname, options, callback);
    })
    .catch(() => {
      dns.lookup(hostname, options, callback);
    });
}

// HTTPS Agent with DoH lookup and permissive TLS
export const dohHttpsAgent = new https.Agent({
  lookup: dohLookup,
  rejectUnauthorized: false,
  keepAlive: true,
  timeout: 30000,
});

// HTTP Agent with DoH lookup
export const dohHttpAgent = new http.Agent({
  lookup: dohLookup,
  keepAlive: true,
  timeout: 30000,
});

/**
 * Fetch wrapper that automatically uses DoH agent for HTTP/HTTPS
 */
export async function fetchWithDoH(url, options = {}) {
  const isHttps = url.startsWith('https://');
  const agent = options.agent || (isHttps ? dohHttpsAgent : dohHttpAgent);

  return fetch(url, {
    ...options,
    agent,
  });
}
