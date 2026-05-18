import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Mail, ShieldCheck, Sparkles, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardView } from "@/components/DashboardView";
import { Navbar } from "@/components/Navbar";
import { PremiumBackground } from "@/components/PremiumBackground";
import { connectGmail, login, logout, register } from "@/lib/api";
import type { LoginRequest, RegisterRequest } from "@/lib/api";
import type { PublicPage } from "@/types/navigation";

export type { PublicPage } from "@/types/navigation";

type AppView = "public" | "dashboard";
type AuthMode = "login" | "register";

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "instant" });
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    Boolean(localStorage.getItem("spendlens_token")),
  );

  const [appView, setAppView] = useState<AppView>(() =>
    Boolean(localStorage.getItem("spendlens_token")) ? "dashboard" : "public",
  );
  const [publicPage, setPublicPage] = useState<PublicPage>("home");

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("juano@test.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigateToPage = useCallback((page: PublicPage) => {
    setAppView("public");
    setPublicPage(page);
    scrollToTop();
  }, []);

  const openDashboard = useCallback(() => {
    setAppView("dashboard");
    scrollToTop();
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setIsAuthenticated(false);
    setAppView("public");
    setPublicPage("home");
    setName("");
    setEmail("juano@test.com");
    setPassword("password123");
    setError(null);
    setMessage(null);
    scrollToTop();
  }, []);

  const handleAuthModeChange = useCallback((mode: AuthMode) => {
    setAuthMode(mode);
    setError(null);
    setMessage(null);
  }, []);

  const handleDashboard = useCallback(() => {
    if (isAuthenticated) {
      openDashboard();
      return;
    }

    setMessage("Inicia sesión para abrir tu dashboard financiero.");
    setError(null);
    navigateToPage("auth");
  }, [isAuthenticated, navigateToPage, openDashboard]);

  const handleConnectGmail = useCallback(async () => {
    if (!isAuthenticated) {
      setMessage("Inicia sesión para conectar Gmail.");
      setError(null);
      navigateToPage("auth");
      return;
    }

    try {
      setError(null);
      setMessage("Redirigiendo a Google…");
      await connectGmail();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar la conexión con Gmail");
      setMessage(null);
    }
  }, [isAuthenticated, navigateToPage]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmailStatus = params.get("gmail");

    if (!gmailStatus) {
      return;
    }

    if (gmailStatus === "connected") {
      setMessage("Gmail conectado correctamente.");
      setError(null);
    } else if (gmailStatus === "error") {
      setError("No se pudo conectar Gmail. Inténtalo de nuevo.");
      setMessage(null);
    }

    params.delete("gmail");
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (authMode === "login") {
        await login({ email, password } as LoginRequest);
        setMessage("Inicio de sesión correcto. Abriendo dashboard...");
      } else {
        await register({ name, email, password } as RegisterRequest);
        setMessage("Registro completado. Abriendo dashboard...");
      }

      setIsAuthenticated(true);
      openDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error en la autenticación");
    } finally {
      setLoading(false);
    }
  }, [authMode, email, name, openDashboard, password]);

  const authTitle = authMode === "login" ? "Inicia sesión en SpendLens" : "Crea tu cuenta";
  const submitLabel = authMode === "login" ? "Entrar" : "Registrar";
  const switchLabel = authMode === "login" ? "Crear cuenta" : "Ya tengo cuenta";

  const navbarActivePage: PublicPage = appView === "dashboard" ? "home" : publicPage;

  return (
    <PremiumBackground>
      <Navbar
        isAuthenticated={isAuthenticated}
        activePage={navbarActivePage}
        onNavigatePage={navigateToPage}
        onDashboard={handleDashboard}
        onConnectGmail={handleConnectGmail}
        onLogout={handleLogout}
      />

      {appView === "dashboard" && isAuthenticated ? (
        <DashboardView onBackToLanding={handleLogout} onLogout={handleLogout} />
      ) : (
        <main className="relative z-10">
          {publicPage === "home" ? <HomePage onConnectGmail={handleConnectGmail} onLogin={() => navigateToPage("auth")} onOpenDashboard={handleDashboard} /> : null}
          {publicPage === "product" ? <ProductPage /> : null}
          {publicPage === "security" ? <SecurityPage /> : null}
          {publicPage === "docs" ? <DocsPage /> : null}
          {publicPage === "auth" ? (
            <AuthPage
              authMode={authMode}
              authTitle={authTitle}
              submitLabel={submitLabel}
              switchLabel={switchLabel}
              name={name}
              email={email}
              password={password}
              loading={loading}
              message={message}
              error={error}
              onNameChange={setName}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={handleSubmit}
              onAuthModeChange={handleAuthModeChange}
            />
          ) : null}
        </main>
      )}
    </PremiumBackground>
  );
}

function HomePage({
  onConnectGmail,
  onLogin,
  onOpenDashboard,
}: {
  onConnectGmail: () => void;
  onLogin: () => void;
  onOpenDashboard: () => void;
}) {
  return (
    <>
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium text-neutral-600 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300">
            <Sparkles className="h-4 w-4 text-[#3BA3FF]" />
            SpendLens
          </p>

          <h1 className="text-balance font-serif text-6xl font-semibold leading-[1.08] tracking-[-0.055em] text-neutral-950 dark:text-white md:text-8xl">
            Convierte tus recibos de Gmail en claridad financiera.
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-balance font-serif text-lg leading-8 text-neutral-600 dark:text-neutral-400 md:text-xl">
            SpendLens registra gastos, procesa recibos desde texto y transforma tus movimientos en un dashboard financiero limpio, privado y fácil de leer.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              onClick={onConnectGmail}
              className="rounded-full bg-[#2F80FF] px-7 py-6 text-base font-semibold text-white shadow-[0_20px_60px_rgba(47,128,255,0.35)] transition hover:bg-[#3BA3FF]"
            >
              <Mail className="mr-2 h-5 w-5" />
              Conectar Gmail
            </Button>

            <Button
              variant="outline"
              onClick={onLogin}
              className="rounded-full border-black/10 bg-white/70 px-7 py-6 text-base font-semibold text-neutral-950 backdrop-blur-xl transition hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
            >
              Iniciar sesión
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-500">
            Tus datos permanecen privados. Conecta Gmail con OAuth de solo lectura.
          </p>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-black/10 bg-white/75 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#3BA3FF]">Dashboard</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white md:text-5xl">
                Del recibo al resumen financiero.
              </h2>
              <p className="mt-5 text-lg leading-8 text-neutral-600 dark:text-neutral-300">
                Entra al dashboard para ver totales, procesar recibos, importar gastos de prueba y gestionar transacciones.
              </p>

              <Button
                onClick={onOpenDashboard}
                className="mt-8 rounded-full bg-[#2F80FF] px-7 py-6 text-base font-semibold text-white shadow-[0_20px_60px_rgba(47,128,255,0.30)] transition hover:bg-[#3BA3FF]"
              >
                Abrir dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <PreviewMetric label="Total mensual" value="$757.946" />
              <PreviewMetric label="Número de gastos" value="10" />
              <PreviewMetric label="Promedio" value="$75.795" />
              <PreviewMetric label="Moneda" value="COP" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ProductPage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#3BA3FF]">Producto</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white md:text-5xl">
          Una experiencia financiera premium.
        </h1>
        <p className="mt-5 text-lg leading-8 text-neutral-600 dark:text-neutral-300">
          Crea gastos manuales, procesa recibos, revisa totales y elimina transacciones desde un dashboard conectado al backend real.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <FeatureCard
          icon={<WalletCards className="h-6 w-6" />}
          title="Gastos centralizados"
          description="Registra y visualiza transacciones con total, promedio, origen y tabla dinámica."
        />
        <FeatureCard
          icon={<Mail className="h-6 w-6" />}
          title="Recibos inteligentes"
          description="Sincroniza Gmail o procesa texto de recibos para convertirlos en gastos automáticos."
        />
        <FeatureCard
          icon={<ShieldCheck className="h-6 w-6" />}
          title="Acceso seguro"
          description="Autenticación JWT con endpoints protegidos y sesión persistente en el navegador."
        />
      </div>
    </section>
  );
}

function SecurityPage() {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#3BA3FF]">Seguridad</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white md:text-5xl">
          Privacidad primero.
        </h1>
      </div>

      <div className="rounded-[2rem] border border-black/10 bg-white/75 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
        <p className="text-lg leading-8 text-neutral-600 dark:text-neutral-300">
          La versión actual usa JWT para proteger dashboard, gastos e importaciones. Gmail se conecta mediante OAuth de Google con permisos de solo lectura; los tokens se guardan en el backend, no en el frontend.
        </p>
      </div>
    </section>
  );
}

function DocsPage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="rounded-[2rem] border border-black/10 bg-white/75 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#3BA3FF]">Docs</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white md:text-4xl">
          Arquitectura actual.
        </h1>
        <p className="mt-5 text-lg leading-8 text-neutral-600 dark:text-neutral-300">
          Frontend React/Vite, backend Spring Boot, PostgreSQL con Flyway, JWT, Gmail OAuth, sync de correos e importación de recibos desde texto.
        </p>
      </div>
    </section>
  );
}

function AuthPage({
  authMode,
  authTitle,
  submitLabel,
  switchLabel,
  name,
  email,
  password,
  loading,
  message,
  error,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onAuthModeChange,
}: {
  authMode: AuthMode;
  authTitle: string;
  submitLabel: string;
  switchLabel: string;
  name: string;
  email: string;
  password: string;
  loading: boolean;
  message: string | null;
  error: string | null;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onAuthModeChange: (mode: AuthMode) => void;
}) {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div className="rounded-[2rem] border border-black/10 bg-white/75 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#3BA3FF]">Acceso</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white md:text-5xl">
          Entra a tu dashboard premium.
        </h1>
        <p className="mt-5 text-lg leading-8 text-neutral-600 dark:text-neutral-300">
          Usa tus credenciales para acceder al panel financiero real, crear gastos y sincronizar recibos desde Gmail.
        </p>
      </div>

      <Card className="rounded-[2rem] border-black/10 bg-white/80 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
        <CardHeader>
          <CardTitle className="text-2xl text-neutral-950 dark:text-white">{authTitle}</CardTitle>
          <CardDescription className="text-neutral-600 dark:text-neutral-400">
            {authMode === "login"
              ? "Introduce tu correo y contraseña para acceder."
              : "Regístrate y accede a tu dashboard inmediato."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {error ? (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-200">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-200">
              {message}
            </div>
          ) : null}

          {authMode === "register" ? (
            <label className="block space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <span>Nombre</span>
              <input
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="Tu nombre"
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-neutral-950 outline-none transition focus:border-[#3BA3FF] focus:ring-2 focus:ring-[#3BA3FF]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </label>
          ) : null}

          <label className="block space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <span>Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="tu@correo.com"
              className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-neutral-950 outline-none transition focus:border-[#3BA3FF] focus:ring-2 focus:ring-[#3BA3FF]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </label>

          <label className="block space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <span>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="********"
              className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-neutral-950 outline-none transition focus:border-[#3BA3FF] focus:ring-2 focus:ring-[#3BA3FF]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </label>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              onClick={onSubmit}
              disabled={loading}
              className="min-w-[150px] rounded-full bg-[#2F80FF] px-6 py-5 font-semibold text-white transition hover:bg-[#3BA3FF]"
            >
              {loading ? "Cargando..." : submitLabel}
            </Button>

            <button
              type="button"
              onClick={() => onAuthModeChange(authMode === "login" ? "register" : "login")}
              className="text-sm text-neutral-500 transition hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
            >
              {switchLabel}
            </button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] border border-black/10 bg-white/75 p-7 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-[0_35px_100px_rgba(47,128,255,0.16)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2F80FF]/10 text-[#3BA3FF]">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">{title}</h3>
      <p className="mt-3 leading-7 text-neutral-600 dark:text-neutral-400">{description}</p>
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-black/10 bg-white/70 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-neutral-950 dark:text-white">{value}</p>
    </div>
  );
}
