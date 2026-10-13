import { fetchWithDoH } from '../api/_lib/dohAgent.js';
import * as cheerio from 'cheerio';

async function resolveBunkrVideo(fileId) {
  const BUNKR_DOMAINS = ['https://bunkr.cr', 'https://bunkr.is', 'https://bunkr.si', 'https://bunkr.ws'];
  
  for (const domain of BUNKR_DOMAINS) {
    try {
      const filePageUrl = `${domain}/f/${fileId}`;
      console.log('Fetching file page:', filePageUrl);
      const res = await fetchWithDoH(filePageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://balbums.st/'
        }
      });
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);

      const title = $('h1, .truncate, title').first().text().replace(/\|.*$/, '').trim();
      
      // Check direct video
      const directVideoSrc = $('video source').attr('src') || $('video').attr('src');
      if (directVideoSrc && (directVideoSrc.includes('.mp4') || directVideoSrc.includes('.webm') || directVideoSrc.includes('.m3u8'))) {
        console.log('Found direct video tag src:', directVideoSrc);
        return { id: fileId, title, stream_url: directVideoSrc, download_url: directVideoSrc };
      }

      // Check download link
      const downloadLink = $('a:contains("Download"), a[download]').attr('href');
      console.log('Download link href:', downloadLink);
      if (!downloadLink) continue;

      // If downloadLink points to a landing download page like dl.bunkr.cr/file/...
      if (downloadLink.includes('/file/')) {
        console.log('Resolving dl page:', downloadLink);
        const dlRes = await fetchWithDoH(downloadLink, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': filePageUrl
          }
        });
        if (!dlRes.ok) continue;
        const dlHtml = await dlRes.text();
        const $dl = cheerio.load(dlHtml);

        const dataId = $dl('#download-btn').attr('data-id') || dlHtml.match(/data-id=["'](\d+)["']/)?.[1];
        const dlOrigin = new URL(downloadLink).origin;
        console.log('dataId:', dataId, 'dlOrigin:', dlOrigin);

        if (dataId) {
          // POST /api/_001_v2
          const metaRes = await fetchWithDoH(`${dlOrigin}/api/_001_v2`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'Referer': downloadLink
            },
            body: JSON.stringify({ id: dataId })
          });
          const meta = await metaRes.json();
          console.log('meta from _001_v2:', meta);

          if (meta.mediafiles && meta.path) {
            const rawUrl = new URL(meta.mediafiles + meta.path);
            const path = decodeURIComponent(rawUrl.pathname);

            // Find sign service url from dlHtml or default
            const signServiceMatch = dlHtml.match(/SIGN_SERVICE_URL\s*=\s*['"]([^'"]+)['"]/);
            const signService = signServiceMatch ? signServiceMatch[1] : 'https://glb-apisign.cdn.cr/sign';

            const signRes = await fetchWithDoH(`${signService}?path=${encodeURIComponent(path)}`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Referer': downloadLink
              }
            });
            const signData = await signRes.json();
            console.log('signData:', signData);

            if (signData.token && signData.ex) {
              rawUrl.searchParams.set('token', signData.token);
              rawUrl.searchParams.set('ex', signData.ex);
              if (meta.original) rawUrl.searchParams.set('n', meta.original);
              const signedUrl = rawUrl.toString();

              return {
                id: fileId,
                title: meta.original || title,
                signed_url: signedUrl,
                stream_url: `/api/balbums/media?url=${encodeURIComponent(signedUrl)}`,
                download_url: signedUrl
              };
            }
          }
        }
      } else {
        // Direct download link
        return {
          id: fileId,
          title,
          stream_url: `/api/balbums/media?url=${encodeURIComponent(downloadLink)}`,
          download_url: downloadLink
        };
      }
    } catch (err) {
      console.warn('Error on mirror', domain, err.message);
    }
  }

  throw new Error('Failed to resolve Bunkr video URL');
}

resolveBunkrVideo('PY98FiZEuDBqo').then(console.log).catch(console.error);
