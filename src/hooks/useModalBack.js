import { useEffect } from "react";

/**
 * useModalBack - Saat modal terbuka, memasukkan "dummy state" ke history.
 * Saat user menekan tombol Back di HP/browser, modal akan tertutup
 * tanpa berpindah halaman.
 *
 * @param {boolean} isOpen - apakah modal sedang terbuka
 * @param {Function} onClose - fungsi untuk menutup modal
 */
export function useModalBack(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return;

    // Masukkan state dummy ke history
    window.history.pushState({ modalOpen: true }, "");

    const handlePopState = (e) => {
      // User menekan Back — tutup modal
      if (e.state?.modalOpen !== true) {
        onClose();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // Jika modal ditutup dengan cara lain (klik X), hapus state dummy
      if (window.history.state?.modalOpen === true) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);
}
