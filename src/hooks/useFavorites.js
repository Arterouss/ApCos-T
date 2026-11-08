import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "apicos_favorites";

export function useFavorites() {
  const getStored = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Gagal memuat favorit:", e);
      return [];
    }
  };

  const [favorites, setFavorites] = useState(getStored);

  // Sync state across components and browser tabs in real-time
  useEffect(() => {
    const handleUpdate = () => {
      setFavorites(getStored());
    };

    window.addEventListener("apicos_favorites_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("apicos_favorites_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const saveFavorites = (newList) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      setFavorites(newList);
      window.dispatchEvent(new Event("apicos_favorites_updated"));
    } catch (e) {
      console.error("Gagal menyimpan favorit:", e);
    }
  };

  const isFavorite = useCallback(
    (idOrLink) => {
      if (!idOrLink) return false;
      const str = String(idOrLink);
      return favorites.some(
        (f) =>
          String(f.id) === str ||
          String(f.link) === str ||
          (f.slug && String(f.slug) === str)
      );
    },
    [favorites]
  );

  const addFavorite = useCallback((item) => {
    if (!item) return;
    const current = getStored();
    const idKey = item.id ? String(item.id) : null;
    const linkKey = item.link ? String(item.link) : null;

    const exists = current.some(
      (f) =>
        (idKey && String(f.id) === idKey) ||
        (linkKey && String(f.link) === linkKey)
    );

    if (!exists) {
      const newItem = {
        ...item,
        id: item.id || item.link,
        cover_url: item.cover_url || item.thumbnail || item.poster || null,
        addedAt: Date.now(),
      };
      saveFavorites([newItem, ...current]);
    }
  }, []);

  const removeFavorite = useCallback((idOrLink) => {
    if (!idOrLink) return;
    const str = String(idOrLink);
    const current = getStored();
    const filtered = current.filter(
      (f) =>
        String(f.id) !== str &&
        String(f.link) !== str &&
        (!f.slug || String(f.slug) !== str)
    );
    saveFavorites(filtered);
  }, []);

  const toggleFavorite = useCallback((item) => {
    if (!item) return;
    const idKey = item.id ? String(item.id) : null;
    const linkKey = item.link ? String(item.link) : null;
    const current = getStored();

    const exists = current.some(
      (f) =>
        (idKey && String(f.id) === idKey) ||
        (linkKey && String(f.link) === linkKey)
    );

    if (exists) {
      const filtered = current.filter(
        (f) =>
          (!idKey || String(f.id) !== idKey) &&
          (!linkKey || String(f.link) !== linkKey)
      );
      saveFavorites(filtered);
    } else {
      const newItem = {
        ...item,
        id: item.id || item.link,
        cover_url: item.cover_url || item.thumbnail || item.poster || null,
        addedAt: Date.now(),
      };
      saveFavorites([newItem, ...current]);
    }
  }, []);

  const importFavorites = useCallback((newItems) => {
    if (!Array.isArray(newItems) || newItems.length === 0) return 0;
    const current = getStored();
    const existingIds = new Set(
      current.map((f) => String(f.id || f.link || f.slug)).filter(Boolean)
    );

    let addedCount = 0;
    const itemsToAdd = [];

    for (const item of newItems) {
      if (!item) continue;
      const key = String(item.id || item.link || item.slug || "");
      if (!key || !existingIds.has(key)) {
        if (key) existingIds.add(key);
        itemsToAdd.push({
          ...item,
          id: item.id || item.link,
          cover_url: item.cover_url || item.thumbnail || item.poster || null,
          addedAt: item.addedAt || Date.now(),
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      saveFavorites([...itemsToAdd, ...current]);
    }
    return addedCount;
  }, []);

  return { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite, importFavorites };
}
