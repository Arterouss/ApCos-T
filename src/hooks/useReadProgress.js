/**
 * useReadProgress – simpan daftar chapter yang sudah dibaca ke localStorage.
 * Key: "readProgress_<mangaSlug>"  →  Set of chapter slugs
 */
import { useState, useCallback } from "react";

const STORAGE_PREFIX = "readProgress_";

export function useReadProgress(mangaSlug) {
  const storageKey = mangaSlug ? `${STORAGE_PREFIX}${mangaSlug}` : null;

  const getRead = useCallback(() => {
    if (!storageKey) return new Set();
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }, [storageKey]);

  const [readSet, setReadSet] = useState(() => getRead());

  const markRead = useCallback((chapterSlug) => {
    if (!storageKey || !chapterSlug) return;
    setReadSet(prev => {
      const next = new Set(prev);
      next.add(chapterSlug);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, [storageKey]);

  const isRead = useCallback((chapterSlug) => {
    return readSet.has(chapterSlug);
  }, [readSet]);

  return { isRead, markRead };
}
