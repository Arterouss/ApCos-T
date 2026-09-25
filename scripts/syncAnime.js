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

    // 2. Sync Ongoing Anime (halaman 1 s/d 3)
    console.log('\n[2/4] Mengambil Anime Ongoing (Sedang Tayang)...');
    const ongoingSlugs = [];
    for (let page = 1; page <= 3; page++) {
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
        await sleep(1000);
      } catch (err) {
        console.log(`❌ Gagal: ${err.message}`);
        break;
      }
    }

    // 3. Sync Completed Anime (halaman 1 s/d 2)
    console.log('\n[3/4] Mengambil Anime Completed (Tamat)...');
    const completedSlugs = [];
    for (let page = 1; page <= 2; page++) {
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
        await sleep(1000);
      } catch (err) {
        console.log(`❌ Gagal: ${err.message}`);
        break;
      }
    }

    // 4. Sync Detail & Streaming Links untuk Anime Ongoing Terpopuler
    console.log('\n[4/4] Mengambil Detail Anime & Link Streaming Video...');
    const targetSlugs = [...new Set(ongoingSlugs)].slice(0, 15); // Ambil 15 anime ongoing terdepan
    console.log(`   Total target: ${targetSlugs.length} anime ongoing terbaru\n`);

    let detailCount = 0;
    let streamCount = 0;

    for (let i = 0; i < targetSlugs.length; i++) {
      const slug = targetSlugs[i];
      process.stdout.write(`   [${i + 1}/${targetSlugs.length}] ${slug} ... `);

      try {
        // Ambil detail anime
        const detail = await scrapeAnimeDetail(slug);
        await saveDetailToDb(slug, detail);
        detailCount++;

        // Ambil streaming untuk episode terbaru (episode pertama di list)
        if (detail.episodes && detail.episodes.length > 0) {
          const latestEp = detail.episodes[0];
          try {
            const stream = await scrapeEpisodeStreaming(latestEp.slug);
            await saveEpisodeToDb(latestEp.slug, stream);
            streamCount++;
            console.log(`✅ Detail & Stream (${latestEp.slug}) Tersimpan!`);
          } catch (e) {
            console.log(`✅ Detail OK (Stream skip: ${e.message})`);
          }
        } else {
          console.log(`✅ Detail OK (Tanpa episode)`);
        }

        await sleep(1200); // Delay sopan
      } catch (err) {
        console.log(`❌ Gagal: ${err.message}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n====================================================');
    console.log('🎉 SINKRONISASI SELESAI DENGAN SUKSES!');
    console.log(`⏱️ Waktu proses : ${duration} detik`);
    console.log(`📚 Anime Ongoing: ${ongoingSlugs.length} anime terdata`);
    console.log(`🏆 Anime Tamat  : ${completedSlugs.length} anime terdata`);
    console.log(`📝 Detail Anime : ${detailCount} anime tersimpan di MongoDB`);
    console.log(`🎬 Stream Video : ${streamCount} episode siap tonton instan!`);
    console.log('====================================================\n');
    console.log('👉 Sekarang web kamu di Vercel sudah terisi data dan siap dibuka!\n');

    process.exit(0);
  } catch (fatal) {
    console.error('\n❌ Fatal error saat sinkronisasi:', fatal);
    process.exit(1);
  }
}

main();
