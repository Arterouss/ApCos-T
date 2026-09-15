import { useState, useEffect, useRef } from "react";

/**
 * usePersistentState - menyimpan state ke sessionStorage
 * agar saat user kembali ke halaman, state tidak di-reset dari awal.
 */
export function usePersistentState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Storage penuh, abaikan
    }
  }, [key, state]);

  return [state, setState];
}

/**
 * useScrollRestoration - menyimpan posisi scroll dan me-restore-nya
 * saat halaman kembali aktif setelah user menekan Back.
 */
export function useScrollRestoration(key) {
  const storageKey = "scroll_" + key;
  const hasRestored = useRef(false);

  useEffect(() => {
    if (hasRestored.current) return;
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      const pos = parseInt(saved, 10);
      setTimeout(() => window.scrollTo({ top: pos, behavior: "instant" }), 80);
    }
    hasRestored.current = true;

    return () => {
      sessionStorage.setItem(storageKey, String(window.scrollY));
    };
  }, [storageKey]);
}
