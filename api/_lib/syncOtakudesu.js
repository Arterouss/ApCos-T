/**
 * syncOtakudesu.js
 * Script/API handler untuk sync katalog anime dari Otakudesu ke MongoDB.
 * Bisa dipanggil manual via GET /api/anime/sync atau dari cron job.
 * 
 * Mode sync:
 *  - 'ongoing'   : ambil semua halaman ongoing
 *  - 'completed' : ambil semua halaman completed
 *  - 'details'   : ambil detail untuk tiap anime yang belum ada di DB
 *  - 'full'      : semua di atas
 */

import {
  scrapeOngoingAnime,
  scrapeCompletedAnime,
  scrapeAnimeDetail,
} from './scraperOtakudesu.js';

import {
  saveOngoingToDb,
  saveCompletedToDb,
  saveDetailToDb,
  getDetailFromDb,
  createSyncLog,
  updateSyncLog,
} from './animeDb.js';

import { connectDB } from './telegramDb.js';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Sync ongoing pages ────────────────────────────────────────────────────────
async function syncOngoing(maxPages = 5) {
  const slugSet = new Set();
  for (let page = 1; page <= maxPages; page++) {
    try {
      console.log(`[Sync] Ongoing page ${page}/${maxPages}...`);
      const data = await scrapeOngoingAnime(page);
      await saveOngoingToDb(page, data);

      // Kumpulkan slug untuk sync detail
      if (data && data.animeList) {
        data.animeList.forEach(a => { if (a.slug) slugSet.add(a.slug); });
      }

      // Stop early jika halaman ini kosong atau tidak ada next
      if (!data || !data.animeList || data.animeList.length === 0) break;
      if (!data.pagination || !data.pagination.hasNext) break;

      await sleep(1500);
    } catch (e) {
      console.error(`[Sync] Ongoing page ${page} error:`, e.message);
      break;
    }
  }
  return Array.from(slugSet);
}

// ─── Sync completed pages ──────────────────────────────────────────────────────
async function syncCompleted(maxPages = 10) {
  const slugSet = new Set();
  for (let page = 1; page <= maxPages; page++) {
    try {
      console.log(`[Sync] Completed page ${page}/${maxPages}...`);
      const data = await scrapeCompletedAnime(page);
      await saveCompletedToDb(page, data);

      if (data && data.animeList) {
        data.animeList.forEach(a => { if (a.slug) slugSet.add(a.slug); });
      }

      if (!data || !data.animeList || data.animeList.length === 0) break;
      if (!data.pagination || !data.pagination.hasNext) break;

      await sleep(1500);
    } catch (e) {
      console.error(`[Sync] Completed page ${page} error:`, e.message);
      break;
    }
  }
  return Array.from(slugSet);
}

// ─── Sync detail for a list of slugs ──────────────────────────────────────────
async function syncDetails(slugs, forceUpdate = false) {
  let synced = 0;
  const errors = [];

  for (const slug of slugs) {
    try {
      // Skip kalau sudah ada di DB dan tidak force
      if (!forceUpdate) {
        const existing = await getDetailFromDb(slug);
        if (existing) {
          console.log(`[Sync] Detail ${slug} already cached, skip.`);
          continue;
        }
      }

      console.log(`[Sync] Detail fetching: ${slug}`);
      const data = await scrapeAnimeDetail(slug);
      await saveDetailToDb(slug, data);
      synced++;
      await sleep(2000); // Sopan ke server
    } catch (e) {
      console.error(`[Sync] Detail ${slug} error:`, e.message);
      errors.push({ slug, error: e.message });
    }
  }

  return { synced, errors };
}

// ─── Main sync function (exported untuk dipakai di route) ─────────────────────
export async function runSync({ mode = 'ongoing', forceUpdate = false } = {}) {
  const logId = await createSyncLog(mode);
  const startTime = Date.now();
  let totalSynced = 0;
  const allErrors = [];

  try {
    console.log(`[Sync] Starting sync mode="${mode}" force=${forceUpdate}`);

    let slugs = [];

    if (mode === 'ongoing' || mode === 'full') {
      const ongoingSlugs = await syncOngoing(5);
      slugs.push(...ongoingSlugs);
    }

    if (mode === 'completed' || mode === 'full') {
      const completedSlugs = await syncCompleted(10);
      slugs.push(...completedSlugs);
    }

    if (mode === 'details' || mode === 'full') {
      // Dedup slugs
      const uniqueSlugs = [...new Set(slugs)];
      const result = await syncDetails(uniqueSlugs, forceUpdate);
      totalSynced = result.synced;
      allErrors.push(...result.errors);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    await updateSyncLog(logId, {
      status: 'done',
      finishedAt: new Date(),
      totalSynced,
      errors: allErrors,
      duration: `${duration}s`,
    });

    console.log(`[Sync] Done! synced=${totalSynced} errors=${allErrors.length} time=${duration}s`);
    return { success: true, totalSynced, errors: allErrors, duration: `${duration}s` };

  } catch (e) {
    console.error('[Sync] Fatal error:', e.message);
    await updateSyncLog(logId, {
      status: 'error',
      finishedAt: new Date(),
      error: e.message,
    });
    throw e;
  }
}
