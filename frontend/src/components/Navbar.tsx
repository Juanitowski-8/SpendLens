import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavbarProps = {
  view?: string;
  currentView?: string;
  onChangeView?: (view: any) => void;
  onScrollTo?: (id: string) => void;
  onNavigate?: (section: string) => void;
  onDashboard?: () => void;
  onConnectGmail?: () => void;
  onGetStarted?: () => void;
  onDemo?: () => void;
  connectHint?: string | null;
};

export function Navbar({
  onNavigate,
  onScrollTo,
  onDashboard,
  onConnectGmail,
  onGetStarted,
  onDemo,
}: NavbarProps) {
  const goTo = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
      return;
    }

    if (onScrollTo) {
      onScrollTo(section);
      return;
    }

    const element = document.getElementById(section);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openDashboard = () => {
    if (onDashboard) {
      onDashboard();
      return;
    }

    if (onDemo) {
      onDemo();
      return;
    }

    if (onGetStarted) {
      onGetStarted();
      return;
    }

    goTo("dashboard-preview");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030303]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <button
          onClick={() => goTo("top")}
          className="flex items-center gap-3 text-left"
          aria-label="Ir al inicio"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10 shadow-lg shadow-blue-500/10">
            <Sparkles className="h-5 w-5 text-[#3BA3FF]" />
          </span>
          <span className="text-xl font-bold tracking-tight text-white">
            SpendLens
          </span>
        </button>

        <nav className="hidden items-center gap-10 text-sm text-white/60 md:flex">
          <button
            type="button"
            className="transition hover:text-white"
            onClick={() => goTo("product")}
          >
            Producto
          </button>
          <button
            type="button"
            className="transition hover:text-white"
            onClick={() => goTo("security")}
          >
            Seguridad
          </button>
          <button
            type="button"
            className="transition hover:text-white"
            onClick={() => goTo("dashboard-preview")}
          >
            Dashboard
          </button>
          <button
            type="button"
            className="transition hover:text-white"
            onClick={() => goTo("docs")}
          >
            Docs
          </button>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" onClick={openDashboard}>
            Ver demo
          </Button>
          <ThemeToggle />
          <Button
            variant="primary"
            size="sm"
            onClick={onConnectGmail ?? openDashboard}
          >
            Conectar Gmail
          </Button>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white md:hidden"
          onClick={openDashboard}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}