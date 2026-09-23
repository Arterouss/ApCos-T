// Filter module to block BL / Gay / Yaoi / Bara / Shounen-Ai content and genres
// Keeps Yuri / Lesbian / Straight content untouched as requested.

const BLOCKED_PATTERNS = [
  // English words and boundaries
  /\byaoi\b/i,
  /\bshounen[\s\-_]*ai\b/i,
  /\bshonen[\s\-_]*ai\b/i,
  /\bshōnen[\s\-_]*ai\b/i,
  /\bboys?[\s\-_]*love\b/i,
  /\bboy['’]s[\s\-_]*love\b/i,
  /\bbl\b/i,
  /\bb\.l\.\b/i,
  /\bgays?\b/i,
  /\bbara\b/i,
  /\bmale[\s\-_]*on[\s\-_]*male\b/i,
  /\bmale[\s\-_]*x[\s\-_]*male\b/i,
  /\bmales?[\s\-_]*only\b/i,
  /\bguys?[\s\-_]*only\b/i,
  /\bdanmei\b/i,
  /\bfudanshi\b/i,
  /\btwinks?\b/i,
  /\bm[\s\/]m\b/i,

  // Asian / Chinese terms (CavPorn, Doujin)
  /男同/i,
  /男男/i,
  /基佬/i,
  /耽美/i,
  /钙片/i,

  // Japanese kana / kanji
  /やおい/,
  /ヤオイ/,
  /ボーイズラブ/,
  /ゲイ/,
  /薔薇(?=.*(?:コミック|漫画|アニメ|同人|系))/
];

/**
 * Checks if a string (genre, tag, title) matches BL / Gay / Yaoi
 */
export const isBlockedText = (text) => {
  if (!text || typeof text !== "string") return false;
  const str = text.trim();
  if (!str) return false;

  const lower = str.toLowerCase();

  // Fast exact match check
  if (
    lower === "bl" ||
    lower === "yaoi" ||
    lower === "gay" ||
    lower === "gays" ||
    lower === "bara" ||
    lower === "shounen-ai" ||
    lower === "shounen ai" ||
    lower === "shonen-ai" ||
    lower === "shonen ai" ||
    lower === "boys love" ||
    lower === "boys-love" ||
    lower === "boy's love" ||
    lower === "male on male" ||
    lower === "males only" ||
    lower === "danmei"
  ) {
    return true;
  }

  return BLOCKED_PATTERNS.some((pattern) => pattern.test(str));
};

/**
 * Checks if an item (video, comic, gallery, post) contains blocked tags/genres/title
 */
export const isBlockedItem = (item) => {
  if (!item) return false;

  // 1. Check title attributes
  const titles = [item.title, item.english_title, item.japanese_title, item.name];
  for (const t of titles) {
    if (t && isBlockedText(t)) return true;
  }

  // 2. Check tag / genre / category arrays
  const tagCollections = [
    item.tags,
    item.genres,
    item.categories,
    item.hentai_tags,
    item.tag_list
  ];

  for (const arr of tagCollections) {
    if (Array.isArray(arr)) {
      for (const t of arr) {
        if (typeof t === "string" && isBlockedText(t)) return true;
        if (t && typeof t === "object") {
          const val = t.name || t.text || t.tag || t.title || t.slug || t.label || "";
          if (isBlockedText(val)) return true;
        }
      }
    }
  }

  // 3. Check slug or id
  const slugOrId = item.slug || item.id || "";
  if (typeof slugOrId === "string") {
    if (/\b(yaoi|gay|boys-love|shounen-ai|danmei)\b/i.test(slugOrId)) {
      return true;
    }
  }

  return false;
};

/**
 * Filters an array of items (videos, manga, galleries) removing blocked content
 */
export const filterBlockedItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => !isBlockedItem(item));
};

/**
 * Filters an array of tags / genres / categories
 */
export const filterBlockedTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  return tags.filter((t) => {
    if (typeof t === "string") return !isBlockedText(t);
    if (t && typeof t === "object") {
      const val = t.name || t.text || t.tag || t.title || t.slug || t.label || t.value || "";
      return !isBlockedText(val);
    }
    return true;
  });
};
