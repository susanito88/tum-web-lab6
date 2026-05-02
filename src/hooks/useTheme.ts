import { useState, useEffect } from "react";
import type { Theme } from "@/types";
import {
  localStorageService,
  applyTheme,
  subscribeToSystemTheme,
} from "@/services/storage/localStorageService";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("worlde_theme");
    if (stored === "light" || stored === "dark" || stored === "colorblind") {
      return stored;
    }
    // Check system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    applyTheme(theme);
    localStorageService.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    subscribeToSystemTheme();
  }, []);

  return {
    theme,
    setTheme,
    toggleTheme: () =>
      setTheme((current) => (current === "light" ? "dark" : "light")),
  };
}
