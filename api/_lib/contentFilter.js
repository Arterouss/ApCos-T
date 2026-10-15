// Backend content filter for BL / Gay / Yaoi / Bara / Shounen-Ai content
// Keeps Yuri / Lesbian / straight content untouched as requested.

const BLOCKED_PATTERNS = [
  // Yaoi & BL variations
  /\byaoi\b/i,
  /\bshounen[\s\-_]*ai\b/i,
  /\bshonen[\s\-_]*ai\b/i,
  /\bshōnen[\s\-_]*ai\b/i,
  /\bboys?[\s\-_]*love\b/i,
  /\bboy['’]s[\s\-_]*love\b/i,
  /\bbl\b/i,
  /\bb\.l\.\b/i,
  /\bdanmei\b/i,
  /\bfudanshi\b/i,

  // Gay & male homosexual terms
  /\bgays?\b/i,
  /\bbara\b/i,
  /\bgachimuchi\b/i,
  /\btwinks?\b/i,
  /\bbussy\b/i,

  // Male-on-male interaction terms
  /\bmale[\s\-_]*on[\s\-_]*male\b/i,
  /\bmale[\s\-_]*x[\s\-_]*male\b/i,
  /\bmales?[\s\-_]*only\b/i,
  /\bman[\s\-_]*on[\s\-_]*man\b/i,
  /\bman[\s\-_]*x[\s\-_]*man\b/i,
  /\bmen[\s\-_]*only\b/i,
  /\bguys?[\s\-_]*only\b/i,
  /\bguy[\s\-_]*on[\s\-_]*guy\b/i,
  /\bguy[\s\-_]*x[\s\-_]*guy\b/i,
  /\bm[\s\/_\-]m\b/i,
  /\bmale[\s\/_\-]male\b/i,

  // Specific gay actions/tags in boorus
  /\bgay[\s\-_]+(sex|kiss|couple|romance|porn|action|threesome|group|orgy)\b/i,
  /\byaoi[\s\-_]+(sex|kiss|couple|romance|porn|hands)\b/i,
  /\bfemboy[\s\-_]+(on|x)[\s\-_]+(male|femboy|guy|man)\b/i,
  /\bcrossdressing[\s\-_]+male\b/i,

  // Asian / Chinese terms (CavPorn, Doujin, JAV, etc.)
  /男同/i,
  /男男/i,
  /基佬/i,
  /耽美/i,
  /钙片/i,
  /BL漫/i,

  // Japanese kana / kanji
  /やおい/,
  /ヤオイ/,
  /ボーイズラブ/,
  /ゲイ/,
  /薔薇(?=.*(?:コミック|漫画|アニメ|同人|系))/
];

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
    lower === "danmei" ||
    lower === "fudanshi" ||
    lower === "twink" ||
    lower === "twinks" ||
    lower === "bussy" ||
    lower === "gachimuchi" ||
    lower === "m/m" ||
    lower === "m_m" ||
    lower === "m-m" ||
    lower === "male only" ||
    lower === "males only" ||
    lower === "male_only" ||
    lower === "males_only" ||
    lower === "men only" ||
    lower === "men_only" ||
    lower === "guys only" ||
    lower === "guys_only" ||
    lower === "male on male" ||
    lower === "male_on_male" ||
    lower === "boys love" ||
    lower === "boys_love" ||
    lower === "boys-love" ||
    lower === "shounen ai" ||
    lower === "shounen_ai" ||
    lower === "shounen-ai" ||
    lower === "shonen ai" ||
    lower === "shonen_ai" ||
    lower === "shonen-ai"
  ) {
    return true;
  }

  // Normalize separators (_, -, /, \) to spaces so booru tags like "gay_sex" or "male_on_male" match \b word boundaries
  const normalized = lower.replace(/[_/\\-]+/g, " ");

  // Direct exact match on normalized form
  if (
    normalized === "bl" ||
    normalized === "yaoi" ||
    normalized === "gay" ||
    normalized === "gays" ||
    normalized === "bara" ||
    normalized === "danmei" ||
    normalized === "fudanshi" ||
    normalized === "twink" ||
    normalized === "twinks" ||
    normalized === "bussy" ||
    normalized === "gachimuchi" ||
    normalized === "m m" ||
    normalized === "male only" ||
    normalized === "males only" ||
    normalized === "men only" ||
    normalized === "guys only" ||
    normalized === "male on male" ||
    normalized === "boys love" ||
    normalized === "shounen ai" ||
    normalized === "shonen ai"
  ) {
    return true;
  }

  return BLOCKED_PATTERNS.some((pattern) => pattern.test(normalized) || pattern.test(str));
};

export const isBlockedItem = (item) => {
  if (!item) return false;

  const titles = [item.title, item.english_title, item.japanese_title, item.name, item.tags_str];
  for (const t of titles) {
    if (t && typeof t === "string") {
      if (isBlockedText(t)) return true;
      const parts = t.split(/[,;\n]+/);
      for (const p of parts) {
        if (p && isBlockedText(p)) return true;
      }
    }
  }

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

  const slugOrId = item.slug || item.id || "";
  if (typeof slugOrId === "string") {
    if (/\b(yaoi|gay|boys-love|shounen-ai|danmei|bara|bussy)\b/i.test(slugOrId)) {
      return true;
    }
  }

  return false;
};

export const filterBlockedItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => !isBlockedItem(item));
};

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
