import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();
const NHENTAI_API_KEY = 'nhk_XfrrpwobmaHgAhlndWpsv5hNQZI_CJIUBD7EULG0Nd9QROs3';
const BASE_URL = 'https://nhentai.net/api/v2';

const fetchNhentai = async (endpoint) => {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${NHENTAI_API_KEY}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Nhentai API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Get List of Galleries / Search
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
        const uniqueTagIds = new Set();
        data.result.forEach(gallery => {
          if (gallery.tag_ids) {
            gallery.tag_ids.forEach(id => uniqueTagIds.add(id));
          }
        });

        const idsArray = Array.from(uniqueTagIds);
        const tagMap = {};

        // Fetch tags in chunks of 50 to avoid URI Too Long errors
        const chunkSize = 50;
        for (let i = 0; i < idsArray.length; i += chunkSize) {
          const chunk = idsArray.slice(i, i + chunkSize);
          const tagsResponse = await fetchNhentai(`/tags/ids?ids=${chunk.join(',')}`);
          if (Array.isArray(tagsResponse)) {
            tagsResponse.forEach(tag => {
              tagMap[tag.id] = tag;
            });
          }
        }

        // Attach full tags back to the galleries
        data.result = data.result.map(gallery => {
          let fullTags = gallery.tag_ids 
            ? gallery.tag_ids.map(id => tagMap[id]).filter(Boolean)
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
      } catch (tagErr) {
        console.error('Error resolving tags:', tagErr.message);
        // Continue even if tag resolution fails
      }
    }

    res.json(data);
  } catch (error) {
    console.error('[Nhentai API] List Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch nhentai galleries' });
  }
});

// Get Gallery Detail
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
    res.status(500).json({ error: 'Failed to fetch nhentai gallery detail' });
  }
});

// Proxy for Nhentai Images to bypass ISP blocking on client side
router.get('/image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://nhentai.net/',
      }
    });

    if (!response.ok) {
      return res.status(response.status).send('Error fetching image');
    }

    res.set('Content-Type', response.headers.get('content-type'));
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    response.body.pipe(res);
  } catch (error) {
    console.error('Nhentai Image Proxy Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
