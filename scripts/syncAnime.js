/**
 * scripts/syncAnime.js
 * Script CLI untuk mensinkronisasi katalog anime Otakudesu ke MongoDB Atlas.
 * Dijalankan dari laptop/lokal (karena tidak diblokir Cloudflare).
 * 
 * Penggunaan:
 *   node scripts/syncAnime.js
 *   npm run sync:anime
 */

import {
  scrapeOngoingAnime,
  scrapeCompletedAnime,
  scrapeAnimeDetail,
  scrapeEpisodeStreaming,
} from '../api/_lib/scraperOtakudesu.js';

import {
  saveOngoingToDb,
  saveCompletedToDb,
  saveDetailToDb,
  saveEpisodeToDb,
  getOngoingFromDb,
  getCompletedFromDb,
  getDetailFromDb,
  getEpisodeFromDb,
  setupIndexes,
} from '../api/_lib/animeDb.js';

import { connectDB } from '../api/_lib/telegramDb.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('====================================================');
  console.log('🚀 MEMULAI SYNC ANIME SUB INDO KE MONGODB ATLAS');
  console.log('====================================================\n');

  const startTime = Date.now();

  try {
    // 1. Connect MongoDB
    console.log('[1/4] Menghubungkan ke MongoDB Atlas...');
    const db = await connectDB();
    console.log(`✅ Terhubung ke database: ${db.databaseName}`);
    await setupIndexes();

    // 2. Sync Ongoing Anime (halaman 1)
    console.log('\n[2/4] Mengambil Anime Ongoing (Sedang Tayang)...');
    const isFullSync = process.argv.includes('--full');
    const maxOngoingPages = isFullSync ? 3 : 1;
    const ongoingSlugs = [];

    for (let page = 1; page <= maxOngoingPages; page++) {
      try {
        process.stdout.write(`   Mengambil Ongoing Halaman ${page}... `);
        const data = await scrapeOngoingAnime(page);
        if (data && data.animeList && data.animeList.length > 0) {
          await saveOngoingToDb(page, data);
          data.animeList.forEach((item) => {
            if (item.slug) ongoingSlugs.push(item.slug);
          });
          console.log(`✅ Berhasil (${data.animeList.length} anime)`);
        } else {
          console.log(`⚠️ Halaman kosong`);
          break;
        }
        await sleep(1500);
      } catch (err) {
        console.log(`❌ Gagal: ${err.message}`);
        // Jika gagal tapi DB sudah ada data lama, tetap gunakan data DB
        const existingOngoing = await getOngoingFromDb(page);
        if (existingOngoing && existingOngoing.animeList) {
          console.log(`   ℹ️ Menggunakan data existing dari DB (${existingOngoing.animeList.length} anime)`);
          existingOngoing.animeList.forEach((item) => {
            if (item.slug) ongoingSlugs.push(item.slug);
          });
        }
        break;
      }
    }

    // 3. Sync Completed Anime (hanya jika DB kosong atau mode --full)
    console.log('\n[3/4] Memeriksa Anime Completed (Tamat)...');
    const existingCompleted = await getCompletedFromDb(1);
    const completedSlugs = [];

    if (!existingCompleted || isFullSync) {
      const maxCompletedPages = isFullSync ? 2 : 1;
      for (let page = 1; page <= maxCompletedPages; page++) {
        try {
          process.stdout.write(`   Mengambil Completed Halaman ${page}... `);
          const data = await scrapeCompletedAnime(page);
          if (data && data.animeList && data.animeList.length > 0) {
            await saveCompletedToDb(page, data);
            data.animeList.forEach((item) => {
              if (item.slug) completedSlugs.push(item.slug);
            });
            console.log(`✅ Berhasil (${data.animeList.length} anime)`);
          } else {
            console.log(`⚠️ Halaman kosong`);
            break;
          }
          await sleep(1500);
        } catch (err) {
          console.log(`❌ Gagal: ${err.message}`);
          break;
        }
      }
    } else {
      console.log(`   ⏭️ Sudah ada ${existingCompleted.animeList?.length || 25} anime tamat di MongoDB (skip agar hemat kuota)`);
      if (existingCompleted.animeList) {
        existingCompleted.animeList.forEach((item) => {
          if (item.slug) completedSlugs.push(item.slug);
        });
      }
    }

    // 4. Sync Detail & Streaming Links (Smart Diff: hanya scrape yang belum ada di DB)
    console.log('\n[4/4] Mengambil Detail Anime & Link Streaming Video (Smart Diff)...');
    const targetSlugs = [...new Set(ongoingSlugs)].slice(0, 15); // 15 anime ongoing terdepan
    console.log(`   Total target: ${targetSlugs.length} anime ongoing terbaru\n`);

    let detailCount = 0;
    let streamCount = 0;
    let skipCount = 0;

    for (let i = 0; i < targetSlugs.length; i++) {
      const slug = targetSlugs[i];
      process.stdout.write(`   [${i + 1}/${targetSlugs.length}] ${slug} ... `);

      try {
        // Cek apakah detail dan stream sudah tersimpan di MongoDB
        let detail = await getDetailFromDb(slug);
        let needDetailScrape = !detail;

        if (needDetailScrape) {
          detail = await scrapeAnimeDetail(slug);
          await saveDetailToDb(slug, detail);
          detailCount++;
        }

        if (detail && detail.episodes && detail.episodes.length > 0) {
          // Sync Episode Terbaru & Episode 1 (paling dicari penonton awal)
          const targetEps = [detail.episodes[0]];
          if (detail.episodes.length > 1) {
            const firstEp = detail.episodes[detail.episodes.length - 1];
            if (firstEp.slug !== detail.episodes[0].slug) {
              targetEps.push(firstEp);
            }
          }

          const epStatuses = [];
          for (const ep of targetEps) {
            const existingStream = await getEpisodeFromDb(ep.slug);
            if (existingStream && (existingStream.defaultStreamUrl || existingStream.streamUrl)) {
              skipCount++;
              epStatuses.push(`⏭️ ${ep.slug} (cached)`);
            } else {
              try {
                const stream = await scrapeEpisodeStreaming(ep.slug);
                await saveEpisodeToDb(ep.slug, stream);
                streamCount++;
                epStatuses.push(`✅ ${ep.slug} (saved)`);
              } catch (e) {
                epStatuses.push(`⚠️ ${ep.slug} (${e.message})`);
              }
              await sleep(1200);
            }
          }
          console.log(epStatuses.join(' | '));
        } else {
          console.log(`ℹ️ Detail tersimpan (tanpa episode)`);
        }
      } catch (err) {
        console.log(`❌ Gagal: ${err.message}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n====================================================');
    console.log('🎉 SINKRONISASI SELESAI DENGAN SUKSES!');
    console.log(`⏱️ Waktu proses  : ${duration} detik`);
    console.log(`📚 Anime Ongoing : ${ongoingSlugs.length} anime`);
    console.log(`🏆 Anime Tamat   : ${completedSlugs.length} anime`);
    console.log(`📝 Detail Baru   : ${detailCount} anime tersimpan`);
    console.log(`🎬 Stream Baru   : ${streamCount} episode baru siap tonton`);
    console.log(`⏭️ Up-to-Date    : ${skipCount} anime tidak perlu request ulang`);
    console.log('====================================================\n');
    console.log('👉 Sekarang web kamu di Vercel sudah terisi data dan siap dibuka!\n');

    process.exit(0);
  } catch (fatal) {
    console.error('\n❌ Fatal error saat sinkronisasi:', fatal);
    process.exit(1);
  }
}

main();
