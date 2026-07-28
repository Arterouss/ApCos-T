import { getBrowser } from "./scraper.js";

const BASE_URL = "https://doujin.desu.xxx";

export const scrapeDoujinList = async ({ page = 1, type = "", genre = "", search = "" }) => {
  const browser = await getBrowser();
  const pageInstance = await browser.newPage();
  
  // DoujinDesu SPA routes yang benar (berdasarkan pengujian):
  //   Trending (Homepage): /
  //   Semua: /explore
  //   Doujin/Manga: /doujin
  //   Manhwa: /manhwa
  //   Genre: /genres/slug
  //   Search: /search?q=X
  let url = BASE_URL;
  
  if (search) {
    url = `${BASE_URL}/search?q=${encodeURIComponent(search)}`;
  } else if (genre) {
    url = `${BASE_URL}/genres/${genre}${page > 1 ? '?page=' + page : ''}`;
  } else if (type === "manga" || type === "doujin") {
    url = `${BASE_URL}/doujin${page > 1 ? '?page=' + page : ''}`;
  } else if (type === "manhwa") {
    url = `${BASE_URL}/manhwa${page > 1 ? '?page=' + page : ''}`;
  } else if (type === "all") {
    url = `${BASE_URL}/explore${page > 1 ? '?page=' + page : ''}`;
  } else {
    // Default: homepage (trending)
    url = page > 1 ? `${BASE_URL}/?page=${page}` : BASE_URL;
  }

  try {
    await pageInstance.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    console.log(`[Doujin Scraper] Navigating to ${url}`);
    
    await pageInstance.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // SPA needs more time to render content
    await new Promise(r => setTimeout(r, 5000));
    
    // Scroll down to trigger lazy-loading of more cards
    await pageInstance.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 2000));
    
    const results = await pageInstance.evaluate((baseUrl) => {
      // Find all anchor tags linking to /manga/slug that contain an img
      const coverAnchors = Array.from(document.querySelectorAll('a[href*="/manga/"]')).filter(a => a.querySelector('img'));
      
      const seen = new Set();
      return coverAnchors.map(a => {
        const href = a.href;
        // Deduplicate (carousel clones can repeat)
        if (seen.has(href)) return null;
        seen.add(href);
        
        const slug = href.replace(/https?:\/\/[^\/]+/, '').replace(/^\//, '').replace(/\/$/, '');
        const img = a.querySelector('img');
        const cover = img ? (img.getAttribute('src') || img.getAttribute('data-src')) : null;
        
        // Extract type text from the anchor (overlay text like "MANHWA", "DOUJINSHI")
        const innerText = a.innerText.trim();
        const lines = innerText.split('\n').map(l => l.trim()).filter(Boolean);
        let typeStr = lines[0] || "Doujin";
        
        // Walk up several parent levels to find a container that has both cover and title
        let container = a.parentElement;
        let title = "Unknown";
        let latest_chapter = "";
        
        // Try up to 5 levels of parents
        for (let depth = 0; depth < 5 && container; depth++) {
          // Look for title link (same href, no img)
          const titleA = Array.from(container.querySelectorAll(`a[href="${href}"]`)).find(ta => ta !== a && !ta.querySelector('img'));
          if (titleA && titleA.innerText.trim().length > 0) {
            title = titleA.innerText.trim();
            break;
          }
          container = container.parentElement;
        }
        
        // Fallback: if title still unknown, try to extract from overlay text lines
        if (title === "Unknown" && lines.length > 1) {
          // lines[0] is type like "MANHWA", find a line that looks like a title
          title = lines.find((l, i) => i > 0 && l.length > 3 && !l.match(/^[\d.]+$/) && !l.includes('READ')) || lines[1] || "Unknown";
        }
        
        // Find latest chapter in the same card container
        container = a.parentElement;
        for (let depth = 0; depth < 5 && container; depth++) {
          const chA = container.querySelector('a[href*="/reader/"]');
          if (chA) {
            latest_chapter = chA.innerText.trim().replace(/\n/g, ' ').slice(0, 40);
            break;
          }
          container = container.parentElement;
        }
        
        return {
          id: slug,
          slug: slug,
          title: title,
          cover_url: cover,
          type: typeStr,
          latest_chapter: latest_chapter,
          original_url: href
        };
      }).filter(Boolean);
    }, BASE_URL);
    
    return results;
  } catch (error) {
    console.error("[Doujin Scraper List Error]", error.message);
    throw new Error("Gagal mengambil data dari DoujinDesu. Kemungkinan terhalang Cloudflare.");
  } finally {
    await pageInstance.close();
  }
};

export const scrapeDoujinDetail = async (slug) => {
  const browser = await getBrowser();
  const pageInstance = await browser.newPage();
  // slug bisa 'manga/...' atau slug langsung
  const url = slug.includes('/') ? `${BASE_URL}/${slug}` : `${BASE_URL}/manga/${slug}`;

  try {
    await pageInstance.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    console.log(`[Doujin Scraper] Navigating Detail to ${url}`);
    
    await pageInstance.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));
    
    const detail = await pageInstance.evaluate(() => {
      // Judul biasanya ada di h1 atau h2 pertama
      const titleEl = document.querySelector('h1') || document.querySelector('h2');
      const title = titleEl ? titleEl.innerText.trim() : "Unknown Title";
      
      // Cover biasanya image pertama yang bukan icon/logo
      const allImgs = Array.from(document.querySelectorAll('img')).map(img => img.src);
      const cover_url = allImgs.find(src => src.includes('pic.desu.xxx/content/web') || src.includes('cover')) || allImgs[0] || "";
      
      // Sinopsis ada di paragraf
      const synopsisPs = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim());
      const synopsis = synopsisPs.length > 0 ? synopsisPs.join('<br/><br/>') : "Tidak ada sinopsis.";
      
      // Genres
      const genres = Array.from(document.querySelectorAll('a[href*="/genres/"]')).map(a => a.innerText.trim());
      
      // Chapters
      const chapterAnchors = Array.from(document.querySelectorAll('a[href*="/reader/"]'));
      const chapters = chapterAnchors.map(a => {
        let href = a.href;
        let cSlug = href.replace(/https?:\/\/[^\/]+/, '').replace(/^\//, '').replace(/\/$/, '');
        // Text is often multiline like "3\nTitle\n27 JUL\n0"
        let parts = a.innerText.trim().split('\n');
        
        return {
          id: cSlug,
          slug: cSlug,
          title: parts.length > 1 ? `Chapter ${parts[0]} - ${parts[1]}` : a.innerText.trim(),
          date: parts.length > 2 ? parts[2] : "",
          original_url: href
        };
      });
      
      // Type/Status (Ongoing/Completed)
      const texts = Array.from(document.querySelectorAll('div, span')).map(e => e.innerText.trim());
      const status = texts.find(t => t.toLowerCase() === 'ongoing' || t.toLowerCase() === 'completed') || "Unknown";
      
      return {
        title,
        cover_url,
        synopsis,
        genres,
        chapters,
        status
      };
    });
    
    return { ...detail, original_url: url, slug };
  } catch (error) {
    console.error("[Doujin Scraper Detail Error]", error.message);
    throw error;
  } finally {
    await pageInstance.close();
  }
};

export const scrapeDoujinChapter = async (slug) => {
  const browser = await getBrowser();
  const pageInstance = await browser.newPage();
  const url = slug.includes('/') ? `${BASE_URL}/${slug}` : `${BASE_URL}/reader/${slug}`;

  try {
    await pageInstance.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    console.log(`[Doujin Scraper] Navigating Chapter to ${url}`);
    
    await pageInstance.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 6000)); // Tunggu render gambar chapter SPA
    
    const chapterData = await pageInstance.evaluate(() => {
      const titleEl = document.querySelector('h1, h2, h3');
      const title = titleEl ? titleEl.innerText.trim() : "Chapter";
      
      // Ambil gambar komik (biasanya gambar yang punya url content panjang atau lazy)
      const allImgs = Array.from(document.querySelectorAll('img')).map(img => img.src);
      const images = allImgs.filter(src => src.includes('pic.desu.xxx') || src.includes('content') || src.includes('pages')).filter(src => !src.includes('banner') && !src.includes('logo'));
      
      // Navigasi prev/next chapter: cari link /reader/ yang ada teks Next atau Prev
      const readerLinks = Array.from(document.querySelectorAll('a[href*="/reader/"]'));
      let nextSlug = null;
      let prevSlug = null;
      
      readerLinks.forEach(a => {
        const text = a.innerText.toLowerCase();
        const icon = a.innerHTML.toLowerCase();
        if (text.includes('next') || icon.includes('right')) {
           nextSlug = a.href.replace(/https?:\/\/[^\/]+/, '').replace(/^\//, '').replace(/\/$/, '');
        }
        if (text.includes('prev') || text.includes('kembali') || icon.includes('left')) {
           prevSlug = a.href.replace(/https?:\/\/[^\/]+/, '').replace(/^\//, '').replace(/\/$/, '');
        }
      });
      
      // Extract mangaSlug from the back button
      const backBtn = document.querySelector('a[href*="/manga/"]');
      const mangaSlug = backBtn ? backBtn.href.split('/manga/')[1].replace(/\/$/, '') : null;
      
      return {
        title,
        images,
        mangaSlug,
        nextSlug,
        prevSlug
      };
    });
    
    return { ...chapterData, original_url: url };
  } catch (error) {
    console.error("[Doujin Scraper Chapter Error]", error.message);
    throw error;
  } finally {
    await pageInstance.close();
  }
};
