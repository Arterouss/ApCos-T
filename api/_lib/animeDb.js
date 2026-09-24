/**
 * animeDb.js
 * MongoDB helper untuk katalog anime Otakudesu (Sub Indo).
 * Menyimpan: ongoing, completed, detail anime, dan episode streaming data.
 */

import { connectDB } from './telegramDb.js';

// Collection names
const COL_ONGOING    = 'anime_ongoing';
const COL_COMPLETED  = 'anime_completed';
const COL_DETAIL     = 'anime_detail';
const COL_EPISODE    = 'anime_episode';
const COL_SYNC_LOG   = 'anime_sync_log';

// TTL configs (ms)
const TTL_ONGOING   = 3 * 60 * 60 * 1000;
const TTL_COMPLETED = 24 * 60 * 60 * 1000;
const TTL_DETAIL    = 12 * 60 * 60 * 1000;
const TTL_EPISODE   = 2 * 60 * 60 * 1000;

const isExpired = (doc, ttl) => {
  if (!doc || !doc.updatedAt) return true;
  return Date.now() - new Date(doc.updatedAt).getTime() > ttl;
};

export async function getOngoingFromDb(page = 1) {
  const db = await connectDB();
  const doc = await db.collection(COL_ONGOING).findOne({ page });
  if (!doc || isExpired(doc, TTL_ONGOING)) return null;
  return doc.data;
}

export async function saveOngoingToDb(page, data) {
  const db = await connectDB();
  await db.collection(COL_ONGOING).updateOne(
    { page },
    { $set: { page, data, updatedAt: new Date() } },
    { upsert: true }
  );
}

export async function getCompletedFromDb(page = 1) {
  const db = await connectDB();
  const doc = await db.collection(COL_COMPLETED).findOne({ page });
  if (!doc || isExpired(doc, TTL_COMPLETED)) return null;
  return doc.data;
}

export async function saveCompletedToDb(page, data) {
  const db = await connectDB();
  await db.collection(COL_COMPLETED).updateOne(
    { page },
    { $set: { page, data, updatedAt: new Date() } },
    { upsert: true }
  );
}

export async function getDetailFromDb(slug) {
  const db = await connectDB();
  const doc = await db.collection(COL_DETAIL).findOne({ slug });
  if (!doc || isExpired(doc, TTL_DETAIL)) return null;
  return doc.data;
}

export async function saveDetailToDb(slug, data) {
  const db = await connectDB();
  await db.collection(COL_DETAIL).updateOne(
    { slug },
    { $set: { slug, data, updatedAt: new Date() } },
    { upsert: true }
  );
}

export async function getEpisodeFromDb(slug) {
  const db = await connectDB();
  const doc = await db.collection(COL_EPISODE).findOne({ slug });
  if (!doc || isExpired(doc, TTL_EPISODE)) return null;
  return doc.data;
}

export async function saveEpisodeToDb(slug, data) {
  const db = await connectDB();
  await db.collection(COL_EPISODE).updateOne(
    { slug },
    { $set: { slug, data, updatedAt: new Date() } },
    { upsert: true }
  );
}

export async function searchAnimeFromDb(query) {
  if (!query || !query.trim()) return [];
  const db = await connectDB();
  const regex = new RegExp(query.trim(), 'i');
  const results = await db.collection(COL_DETAIL).find({
    $or: [
      { 'data.title': regex },
      { 'data.titleJapanese': regex },
    ]
  }).limit(20).toArray();

  return results.map(doc => ({
    title: doc.data.title,
    slug: doc.slug,
    thumbnail: doc.data.thumbnail,
    type: doc.data.type,
    status: doc.data.status,
    rating: doc.data.rating,
    genres: doc.data.genres,
  }));
}

export async function getLastSyncLog() {
  const db = await connectDB();
  return db.collection(COL_SYNC_LOG).findOne({}, { sort: { startedAt: -1 } });
}

export async function createSyncLog(type) {
  const db = await connectDB();
  const result = await db.collection(COL_SYNC_LOG).insertOne({
    type,
    status: 'running',
    startedAt: new Date(),
    finishedAt: null,
    totalSynced: 0,
    errors: [],
  });
  return result.insertedId;
}

export async function updateSyncLog(id, update) {
  const db = await connectDB();
  await db.collection(COL_SYNC_LOG).updateOne({ _id: id }, { $set: update });
}

export async function setupIndexes() {
  try {
    const db = await connectDB();
    await db.collection(COL_ONGOING).createIndex({ page: 1 }, { unique: true });
    await db.collection(COL_COMPLETED).createIndex({ page: 1 }, { unique: true });
    await db.collection(COL_DETAIL).createIndex({ slug: 1 }, { unique: true });
    await db.collection(COL_DETAIL).createIndex({ 'data.title': 'text', 'data.titleJapanese': 'text' });
    await db.collection(COL_EPISODE).createIndex({ slug: 1 }, { unique: true });
    await db.collection(COL_SYNC_LOG).createIndex({ startedAt: -1 });
    console.log('[AnimeDb] Indexes ready');
  } catch (e) {
    if (!e.message?.includes('already exists')) {
      console.warn('[AnimeDb] Index warning:', e.message);
    }
  }
}
