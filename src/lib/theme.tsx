import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "sepia";
export type FontSize = "sm" | "md" | "lg";

const KEY_THEME = "me.theme";
const KEY_FONT = "me.fontsize";

interface ThemeCtx {
  theme: Theme;
  fontSize: FontSize;
  setTheme: (t: Theme) => void;
  setFontSize: (f: FontSize) => void;
  cycleTheme: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

const ORDER: Theme[] = ["light", "dark", "sepia"];
const FONT_PX: Record<FontSize, string> = { sm: "14px", md: "16px", lg: "18px" };

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [fontSize, setFontSizeState] = useState<FontSize>("md");

  useEffect(() => {
    try {
      const t = (localStorage.getItem(KEY_THEME) as Theme) || "light";
      const f = (localStorage.getItem(KEY_FONT) as FontSize) || "md";
      setThemeState(t); setFontSizeState(f);
    } catch {}
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove("dark", "sepia");
    if (theme === "dark") el.classList.add("dark");
    else if (theme === "sepia") el.classList.add("sepia");
    try { localStorage.setItem(KEY_THEME, theme); } catch {}
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_PX[fontSize];
    try { localStorage.setItem(KEY_FONT, fontSize); } catch {}
  }, [fontSize]);

  return (
    <Ctx.Provider value={{
      theme, fontSize,
      setTheme: setThemeState,
      setFontSize: setFontSizeState,
      cycleTheme: () => setThemeState((t) => ORDER[(ORDER.indexOf(t) + 1) % ORDER.length]),
    }}>{children}</Ctx.Provider>
  );
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme requires <ThemeProvider>");
  return v;
}
