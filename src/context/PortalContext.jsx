import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const PortalContext = createContext(null);

const STORAGE_KEY = "apicos_portal_mode";

export function PortalProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "adult";
    } catch {
      return "adult";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore storage errors
    }
  }, [mode]);

  const togglePortalMode = useCallback(() => {
    setMode((prev) => (prev === "adult" ? "general" : "adult"));
  }, []);

  const isAdultMode = mode === "adult";
  const isGeneralMode = mode === "general";

  return (
    <PortalContext.Provider
      value={{ mode, togglePortalMode, isAdultMode, isGeneralMode }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortalMode() {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error("usePortalMode must be used within a PortalProvider");
  }
  return ctx;
}
