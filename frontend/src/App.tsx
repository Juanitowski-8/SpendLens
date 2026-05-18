import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Check,
  LayoutDashboard,
  Mail,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardView } from "@/components/DashboardView";
import { Navbar } from "@/components/Navbar";
import { PremiumBackground } from "@/components/PremiumBackground";
import {
  connectGmail,
  forgotPassword,
  isApiConfigured,
  login,
  logout,
  register,
  resetPassword,
} from "@/lib/api";
import type { LoginRequest, RegisterRequest } from "@/lib/api";
import type { PublicPage } from "@/types/navigation";

export type { PublicPage } from "@/types/navigation";

type AppView = "public" | "dashboard";
type AuthMode = "login" | "register" | "forgot" | "reset";

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "instant" });
}

const landingGlass =
  "rounded-[2rem] border border-black/10 bg-white/75 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.05] dark:shadow-[0_30px_90px_rgba(0,0,0,0.28)]";

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
  const [resetToken, setResetToken] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    const token = params.get("resetToken");
    if (token) {
      setResetToken(token);
      setAuthMode("reset");
      navigateToPage("auth");
    }
    if (params.get("auth") === "login") {
      setAuthMode("login");
      navigateToPage("auth");
    }
    if (params.get("session") === "expired") {
      setError("Tu sesión expiró. Vuelve a iniciar sesión.");
      navigateToPage("auth");
    }
  }, [navigateToPage]);

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
      if (authMode === "forgot") {
        const result = await forgotPassword(email);
        setMessage(result.message);
        return;
      }

      if (authMode === "reset") {
        if (password !== confirmPassword) {
          setError("Las contraseñas no coinciden.");
          return;
        }
        const result = await resetPassword(resetToken, password);
        setMessage(result.message);
        setAuthMode("login");
        return;
      }

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
  }, [authMode, confirmPassword, email, name, openDashboard, password, resetToken]);

  const authTitle =
    authMode === "login"
      ? "Inicia sesión en SpendLens"
      : authMode === "register"
        ? "Crea tu cuenta"
        : authMode === "forgot"
          ? "Recuperar contraseña"
          : "Nueva contraseña";
  const submitLabel =
    authMode === "login"
      ? "Entrar"
      : authMode === "register"
        ? "Registrar"
        : authMode === "forgot"
          ? "Enviar instrucciones"
          : "Cambiar contraseña";
  const switchLabel =
    authMode === "login"
      ? "Crear cuenta"
      : authMode === "register"
        ? "Ya tengo cuenta"
        : "Volver al inicio de sesión";

  const navbarActivePage: PublicPage = appView === "dashboard" ? "home" : publicPage;

  return (
    <PremiumBackground>
      {!isApiConfigured ? <DeployConfigWarning /> : null}
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
          {publicPage === "home" ? (
            <HomePage
              onConnectGmail={handleConnectGmail}
              onLogin={() => navigateToPage("auth")}
              onOpenDashboard={handleDashboard}
              onNavigatePage={navigateToPage}
            />
          ) : null}
          {publicPage === "product" ? (
            <>
              <ProductPage />
              <SiteFooter onNavigatePage={navigateToPage} />
            </>
          ) : null}
          {publicPage === "security" ? (
            <>
              <SecurityPage />
              <SiteFooter onNavigatePage={navigateToPage} />
            </>
          ) : null}
          {publicPage === "docs" ? (
            <>
              <DocsPage />
              <SiteFooter onNavigatePage={navigateToPage} />
            </>
          ) : null}
          {publicPage === "privacy" ? (
            <>
              <PrivacyPage />
              <SiteFooter onNavigatePage={navigateToPage} />
            </>
          ) : null}
          {publicPage === "terms" ? (
            <>
              <TermsPage />
              <SiteFooter onNavigatePage={navigateToPage} />
            </>
          ) : null}
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
              resetToken={resetToken}
              confirmPassword={confirmPassword}
              onResetTokenChange={setResetToken}
              onConfirmPasswordChange={setConfirmPassword}
              onForgotPassword={() => {
                setAuthMode("forgot");
                setError(null);
                setMessage(null);
              }}
              onSubmit={handleSubmit}
              onAuthModeChange={handleAuthModeChange}
            />
          ) : null}
        </main>
      )}
    </PremiumBackground>
  );
}

function DeployConfigWarning() {
  return (
    <div
      role="alert"
      className="relative z-[60] border-b border-amber-500/30 bg-amber-500/15 px-6 py-3 text-center text-sm text-amber-950 dark:text-amber-100"
    >
      Falta <strong className="font-semibold">VITE_API_URL</strong> en Vercel. Define la URL pública del backend (Render)
      y vuelve a desplegar. Sin eso, login y dashboard no funcionan para otros usuarios.
    </div>
  );
}

function HomePage({
  onConnectGmail,
  onLogin,
  onOpenDashboard,
  onNavigatePage,
}: {
  onConnectGmail: () => void;
  onLogin: () => void;
  onOpenDashboard: () => void;
  onNavigatePage: (page: PublicPage) => void;
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
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#3BA3FF]">
            Cómo funciona
          </p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white md:text-5xl">
            De Gmail a claridad financiera en tres pasos.
          </h2>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <StepCard
              step="01"
              icon={<Mail className="h-6 w-6" />}
              title="Conecta Gmail"
              description="Autoriza acceso de solo lectura mediante OAuth."
            />
            <StepCard
              step="02"
              icon={<ScanLine className="h-6 w-6" />}
              title="Detectamos recibos"
              description="SpendLens identifica compras, pagos y facturas relevantes."
            />
            <StepCard
              step="03"
              icon={<LayoutDashboard className="h-6 w-6" />}
              title="Visualiza tu mes"
              description="Consulta totales, comercios y transacciones en un dashboard limpio."
            />
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#3BA3FF]">
            Vista previa
          </p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white md:text-5xl">
            Todo tu mes financiero en una sola vista.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-neutral-600 dark:text-neutral-400">
            Métricas, gráficos y transacciones listas para revisar.
          </p>

          <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <DashboardPreviewMockup />
            <div className="lg:max-w-sm">
              <p className="text-base leading-7 text-neutral-600 dark:text-neutral-400">
                Un panel diseñado para entender tus gastos en segundos: totales del mes, promedio por
                transacción y detalle por comercio.
              </p>
              <Button
                onClick={onOpenDashboard}
                className="mt-8 rounded-full bg-[#2F80FF] px-7 py-6 text-base font-semibold text-white shadow-[0_20px_60px_rgba(47,128,255,0.30)] transition hover:bg-[#3BA3FF]"
              >
                Abrir dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <LandingExtras
        onLogin={onLogin}
        onConnectGmail={onConnectGmail}
        onOpenDashboard={onOpenDashboard}
      />

      <section className="px-6 pb-24">
        <div className={cn("mx-auto max-w-7xl p-8 md:p-10", landingGlass)}>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#3BA3FF]">
                Privacidad
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white md:text-5xl">
                Privacidad por diseño.
              </h2>
            </div>
            <div>
              <p className="text-lg leading-8 text-neutral-600 dark:text-neutral-300">
                SpendLens usa OAuth 2.0 y permisos de solo lectura. Tus correos no se modifican.{" "}
                <button
                  type="button"
                  onClick={() => onNavigatePage("privacy")}
                  className="text-[#2F80FF] underline hover:text-[#3BA3FF]"
                >
                  Política de privacidad
                </button>
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <PrivacyBadge label="Gmail readonly" />
                <PrivacyBadge label="JWT seguro" />
                <PrivacyBadge label="OAuth 2.0" />
                <PrivacyBadge label="PostgreSQL" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter onNavigatePage={onNavigatePage} />
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

function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#3BA3FF]">Legal</p>
      <h1 className="mt-4 text-4xl font-semibold text-neutral-950 dark:text-white">Política de privacidad</h1>
      <div className="mt-8 space-y-6 text-neutral-600 dark:text-neutral-300">
        <p>
          SpendLens procesa datos de gastos que tú importas o registras. No vendemos tu información a terceros.
        </p>
        <p>
          Al conectar Gmail autorizas acceso de solo lectura para detectar recibos. Los tokens OAuth se almacenan
          cifrados en el backend. Puedes desconectar Gmail desde el dashboard en cualquier momento.
        </p>
        <p>
          Conservamos gastos y metadatos mientras mantengas tu cuenta activa. Para eliminar datos, contacta al
          administrador del despliegue o elimina tu cuenta según las políticas de tu instancia.
        </p>
        <p className="text-sm text-neutral-500">Última actualización: mayo 2026.</p>
      </div>
    </section>
  );
}

function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#3BA3FF]">Legal</p>
      <h1 className="mt-4 text-4xl font-semibold text-neutral-950 dark:text-white">Términos de uso</h1>
      <div className="mt-8 space-y-6 text-neutral-600 dark:text-neutral-300">
        <p>
          SpendLens es una herramienta de organización personal. No constituye asesoría financiera, fiscal ni legal.
        </p>
        <p>
          Eres responsable de la exactitud de los gastos importados y de mantener seguras tus credenciales. El servicio
          se ofrece &quot;tal cual&quot; sin garantías de disponibilidad continua.
        </p>
        <p>
          El uso de Gmail está sujeto a las políticas de Google. No modifiques ni reenvíes correos a través de la app
          sin entender los permisos OAuth concedidos.
        </p>
        <p className="text-sm text-neutral-500">Última actualización: mayo 2026.</p>
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
  resetToken,
  confirmPassword,
  onResetTokenChange,
  onConfirmPasswordChange,
  onForgotPassword,
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
  resetToken: string;
  confirmPassword: string;
  loading: boolean;
  message: string | null;
  error: string | null;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onResetTokenChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onForgotPassword: () => void;
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

          {authMode === "reset" ? (
            <label className="block space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <span>Token de recuperación</span>
              <input
                value={resetToken}
                onChange={(event) => onResetTokenChange(event.target.value)}
                placeholder="Pega el token del enlace"
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-neutral-950 outline-none transition focus:border-[#3BA3FF] focus:ring-2 focus:ring-[#3BA3FF]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </label>
          ) : null}

          {authMode !== "reset" ? (
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
          ) : null}

          {authMode !== "forgot" ? (
            <label className="block space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <span>{authMode === "reset" ? "Nueva contraseña" : "Contraseña"}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder="********"
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-neutral-950 outline-none transition focus:border-[#3BA3FF] focus:ring-2 focus:ring-[#3BA3FF]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </label>
          ) : null}

          {authMode === "reset" ? (
            <label className="block space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <span>Confirmar contraseña</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => onConfirmPasswordChange(event.target.value)}
                placeholder="********"
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-neutral-950 outline-none transition focus:border-[#3BA3FF] focus:ring-2 focus:ring-[#3BA3FF]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </label>
          ) : null}

          {authMode === "login" ? (
            <button type="button" onClick={onForgotPassword} className="text-sm text-[#2F80FF] hover:text-[#3BA3FF]">
              Olvidé mi contraseña
            </button>
          ) : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              onClick={onSubmit}
              disabled={loading}
              className="min-w-[150px] rounded-full bg-[#2F80FF] px-6 py-5 font-semibold text-white transition hover:bg-[#3BA3FF]"
            >
              {loading ? "Enviando..." : submitLabel}
            </Button>

            {authMode === "login" || authMode === "register" ? (
              <button
                type="button"
                onClick={() => onAuthModeChange(authMode === "login" ? "register" : "login")}
                className="text-sm text-neutral-500 transition hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
              >
                {switchLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onAuthModeChange("login")}
                className="text-sm text-neutral-500 transition hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
              >
                {switchLabel}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function LandingExtras({
  onLogin,
  onConnectGmail,
  onOpenDashboard,
}: {
  onLogin: () => void;
  onConnectGmail: () => void;
  onOpenDashboard: () => void;
}) {
  return (
    <>
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#3BA3FF]">Planes</p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white md:text-5xl">
            Empieza gratis. Escala cuando lo necesites.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <PricingCard
              name="Personal"
              price="Gratis"
              description="Ideal para ordenar gastos personales del mes."
              features={["Dashboard mensual", "Gastos manuales", "Procesar recibo por texto", "Exportar CSV"]}
              cta="Crear cuenta"
              onCta={onLogin}
            />
            <PricingCard
              name="Pro"
              price="Próximamente"
              description="Sincronización Gmail avanzada y categorías automáticas."
              features={["Todo Personal", "Sync Gmail", "Recategorizar", "Exportar Excel y PDF"]}
              highlighted
              cta="Conectar Gmail"
              onCta={onConnectGmail}
            />
            <PricingCard
              name="Equipo"
              price="A medida"
              description="Para familias o pequeños equipos que comparten visibilidad."
              features={["Múltiples cuentas (roadmap)", "Soporte prioritario", "API dedicada"]}
              cta="Contactar"
              onCta={onLogin}
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#3BA3FF]">Para quién es</p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white md:text-5xl">
            Claridad financiera sin hojas de cálculo.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <AudienceCard
              icon={<Users className="h-6 w-6" />}
              title="Personas"
              description="Entiende en qué se va tu dinero cada mes sin registrar todo a mano."
            />
            <AudienceCard
              icon={<Briefcase className="h-6 w-6" />}
              title="Freelancers"
              description="Separa gastos personales y de trabajo importando recibos desde Gmail."
            />
            <AudienceCard
              icon={<WalletCards className="h-6 w-6" />}
              title="Familias"
              description="Un solo panel para revisar compras, suscripciones y pagos recurrentes."
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#3BA3FF]">Casos de uso</p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white md:text-5xl">
            Lo que SpendLens resuelve hoy.
          </h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              "Importar compras desde correos de Uber, Rappi o tiendas online.",
              "Registrar un gasto en efectivo en segundos.",
              "Filtrar por categoría, origen o monto y exportar el mes.",
              "Recuperar contraseña y gestionar la conexión Gmail desde el dashboard.",
            ].map((item) => (
              <li key={item} className={cn("flex gap-3 rounded-2xl p-5", landingGlass)}>
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#3BA3FF]" />
                <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className={cn("mx-auto max-w-4xl px-8 py-14 text-center", landingGlass)}>
          <h2 className="font-serif text-3xl font-semibold text-neutral-950 dark:text-white md:text-4xl">
            Empieza a ver tu mes con claridad.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-neutral-600 dark:text-neutral-400">
            Conecta Gmail o crea tu cuenta y abre el dashboard en menos de un minuto.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button onClick={onConnectGmail} className="rounded-full bg-[#2F80FF] px-7 py-6 hover:bg-[#3BA3FF]">
              Conectar Gmail
            </Button>
            <Button variant="outline" onClick={onOpenDashboard} className="rounded-full px-7 py-6">
              Ver dashboard
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function SiteFooter({ onNavigatePage }: { onNavigatePage: (page: PublicPage) => void }) {
  return (
    <footer className="border-t border-black/10 px-6 py-12 dark:border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-neutral-500">© {new Date().getFullYear()} SpendLens</p>
        <nav className="flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400">
          <button type="button" className="hover:text-neutral-950 dark:hover:text-white" onClick={() => onNavigatePage("home")}>
            Inicio
          </button>
          <button type="button" className="hover:text-neutral-950 dark:hover:text-white" onClick={() => onNavigatePage("privacy")}>
            Privacidad
          </button>
          <button type="button" className="hover:text-neutral-950 dark:hover:text-white" onClick={() => onNavigatePage("terms")}>
            Términos
          </button>
          <button type="button" className="hover:text-neutral-950 dark:hover:text-white" onClick={() => onNavigatePage("docs")}>
            Docs
          </button>
        </nav>
      </div>
    </footer>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  cta,
  onCta,
  highlighted = false,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  onCta: () => void;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[2rem] p-7",
        landingGlass,
        highlighted && "ring-2 ring-[#2F80FF]/40 dark:ring-[#3BA3FF]/50",
      )}
    >
      <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">{name}</h3>
      <p className="mt-2 text-3xl font-bold text-[#2F80FF] dark:text-[#3BA3FF]">{price}</p>
      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
      <ul className="mt-6 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <Check className="h-4 w-4 shrink-0 text-[#3BA3FF]" />
            {feature}
          </li>
        ))}
      </ul>
      <Button onClick={onCta} className="mt-8 w-full rounded-full bg-[#2F80FF] hover:bg-[#3BA3FF]">
        {cta}
      </Button>
    </div>
  );
}

function AudienceCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className={cn("rounded-[2rem] p-7", landingGlass)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2F80FF]/10 text-[#3BA3FF]">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">{title}</h3>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">{description}</p>
    </div>
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

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        "group rounded-[2rem] p-7 transition hover:-translate-y-0.5",
        landingGlass,
        "hover:border-[#2F80FF]/30 hover:shadow-[0_35px_100px_rgba(47,128,255,0.14)] dark:hover:border-[#3BA3FF]/35",
      )}
    >
      <div className="mb-6 flex items-start justify-between">
        <span className="text-4xl font-light text-neutral-300 dark:text-neutral-600">{step}</span>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2F80FF]/10 text-[#3BA3FF]">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">{title}</h3>
      <p className="mt-3 leading-7 text-neutral-600 dark:text-neutral-400">{description}</p>
    </div>
  );
}

const previewRows = [
  { merchant: "Uber", amount: "$35.000" },
  { merchant: "Netflix", amount: "$29.900" },
  { merchant: "Éxito", amount: "$214.300" },
] as const;

function DashboardPreviewMockup() {
  return (
    <div
      className={cn(
        "w-full max-w-2xl overflow-hidden p-6 md:p-8",
        landingGlass,
        "ring-1 ring-[#2F80FF]/10 dark:ring-[#3BA3FF]/15",
      )}
    >
      <div className="mb-6 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#2F80FF]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        <span className="ml-3 text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
          Dashboard preview
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PreviewMetric label="Total gastado" value="$757.946" />
        <PreviewMetric label="Número de gastos" value="10" />
        <PreviewMetric label="Promedio" value="$75.795" />
        <PreviewMetric label="Moneda" value="COP" />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/8 bg-white/60 dark:border-white/10 dark:bg-black/20">
        <div className="grid grid-cols-2 gap-4 border-b border-black/8 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:border-white/10 dark:text-neutral-400">
          <span>Comercio</span>
          <span className="text-right">Monto</span>
        </div>
        {previewRows.map((row) => (
          <div
            key={row.merchant}
            className="grid grid-cols-2 gap-4 border-b border-black/5 px-4 py-3 last:border-0 dark:border-white/5"
          >
            <span className="font-medium text-neutral-900 dark:text-white">{row.merchant}</span>
            <span className="text-right font-semibold text-neutral-950 dark:text-white">{row.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivacyBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#2F80FF]/25 bg-[#2F80FF]/8 px-4 py-2 text-sm font-medium text-[#1a5fb8] dark:border-[#3BA3FF]/35 dark:bg-[#3BA3FF]/10 dark:text-[#9fd4ff]">
      {label}
    </span>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-black/10 bg-white/80 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-neutral-950 dark:text-white">{value}</p>
    </div>
  );
}

