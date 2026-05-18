import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "spendlens-theme";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      applyTheme(stored);
      return;
    }

    setTheme("dark");
    applyTheme("dark");
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return ctx;
};