import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
      title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
      className="inline-flex size-11 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-950 shadow-sm transition-all duration-300 hover:scale-105 hover:border-[#2F80FF]/35 hover:text-[#006DFF] dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:border-[#3BA3FF]/40 dark:hover:text-[#3BA3FF]"
    >
      {theme === "dark" ? (
        <Sun className="size-[18px]" strokeWidth={1.75} />
      ) : (
        <Moon className="size-[18px]" strokeWidth={1.75} />
      )}
    </button>
  );
}