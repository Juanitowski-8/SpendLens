import { useCallback, useState } from "react";

import { DashboardView } from "@/components/DashboardView";
import { LandingView } from "@/components/LandingView";
import { Navbar } from "@/components/Navbar";

type View = "landing" | "app";

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [connectHint, setConnectHint] = useState<string | null>(null);

  const simulateConnect = useCallback(() => {
    setConnectHint("Simulación: se iniciaría el flujo OAuth de Google.");
    window.setTimeout(() => setConnectHint(null), 3200);
  }, []);

  const scrollTo = useCallback(
    (id: string) => {
      const run = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      if (view !== "landing") {
        setView("landing");
        window.setTimeout(run, 30);
      } else {
        run();
      }
    },
    [view],
  );

  return (
    <div className="min-h-screen bg-[#030303] text-white transition-colors duration-300">
      <Navbar
        view={view}
        onChangeView={setView}
        onScrollTo={scrollTo}
        onDemo={() => scrollTo("preview")}
        onConnectGmail={simulateConnect}
        connectHint={connectHint}
      />
      {view === "landing" ? (
        <LandingView onExploreDashboard={() => setView("app")} onConnectGmail={simulateConnect} />
      ) : (
        <DashboardView onBackToLanding={() => setView("landing")} />
      )}
    </div>
  );
}
