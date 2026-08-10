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
    res.json(data);
  } catch (error) {
    console.error('[Nhentai API] Detail Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch nhentai gallery detail' });
  }
});

export default router;
