import { Menu, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { PublicPage } from "@/types/navigation";
import { cn } from "@/lib/utils";

type NavbarProps = {
  isAuthenticated?: boolean;
  activePage: PublicPage;
  onNavigatePage: (page: PublicPage) => void;
  onDashboard: () => void;
  onConnectGmail: () => void;
  onLogout?: () => void;
};

function NavLink({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "font-medium transition-colors duration-200",
        active
          ? "text-neutral-950 dark:text-white"
          : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
      )}
    >
      {label}
    </button>
  );
}

export function Navbar({
  isAuthenticated = false,
  activePage,
  onNavigatePage,
  onDashboard,
  onConnectGmail,
  onLogout,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/75 backdrop-blur-2xl transition-colors duration-300 dark:border-white/10 dark:bg-[#03050A]/80">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <button
          type="button"
          onClick={() => onNavigatePage("home")}
          className="flex items-center gap-3 text-left transition-opacity duration-200 hover:opacity-85"
          aria-label="Ir al inicio"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#3BA3FF]/35 bg-gradient-to-br from-[#3BA3FF]/25 to-[#2F80FF]/10 shadow-lg shadow-blue-500/10">
            <Sparkles className="h-5 w-5 text-[#3BA3FF]" />
          </span>

          <span className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            SpendLens
          </span>
        </button>

        <nav className="hidden items-center gap-10 text-sm md:flex">
          <NavLink
            label="Producto"
            active={activePage === "product"}
            onClick={() => onNavigatePage("product")}
          />
          <NavLink
            label="Seguridad"
            active={activePage === "security"}
            onClick={() => onNavigatePage("security")}
          />
          <NavLink label="Dashboard" active={false} onClick={onDashboard} />
          <NavLink
            label="Docs"
            active={activePage === "docs"}
            onClick={() => onNavigatePage("docs")}
          />
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-sm text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
            >
              Cerrar sesión
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigatePage("auth")}
              className={cn(
                "text-sm",
                activePage === "auth"
                  ? "text-neutral-950 dark:text-white"
                  : "text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white",
              )}
            >
              Iniciar sesión
            </Button>
          )}

          <ThemeToggle />

          <Button
            className="rounded-full bg-[#2F80FF] px-5 py-2 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(47,128,255,0.28)] transition hover:bg-[#3BA3FF] hover:shadow-[0_20px_50px_rgba(47,128,255,0.38)]"
            onClick={onConnectGmail}
          >
            Conectar Gmail
          </Button>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-950/10 bg-neutral-950/5 text-neutral-950 transition-all duration-200 hover:bg-neutral-950/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08] md:hidden"
          onClick={onDashboard}
          aria-label="Abrir dashboard"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
