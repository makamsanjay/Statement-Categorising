import { createContext, useContext, useEffect, useState } from "react";
import "./theme.css";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>("light"); // 👈 force initial light

  /**
   * 🔒 FIRST PAINT FIX
   * This runs once and guarantees:
   * - light mode on startup
   * - no Chrome / OS dark-mode interference
   */
  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("dark");
    root.classList.add("light");

    localStorage.setItem("theme", "light");
  }, []);

  /**
   * 🔁 Sync theme changes
   */
  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(theme);

    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
