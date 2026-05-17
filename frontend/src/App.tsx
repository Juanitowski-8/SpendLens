import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardView } from "@/components/DashboardView";
import { Navbar } from "@/components/Navbar";
import { login, logout, register } from "@/lib/api";
import type { LoginRequest, RegisterRequest } from "@/lib/api";

type AuthMode = "login" | "register";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(localStorage.getItem("spendlens_token")));
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = useCallback(() => {
    logout();
    setIsAuthenticated(false);
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
    setMessage(null);
  }, []);

  const handleAuthModeChange = useCallback((mode: AuthMode) => {
    setAuthMode(mode);
    setError(null);
    setMessage(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (authMode === "login") {
        await login({ email, password } as LoginRequest);
        setMessage("Inicio de sesión correcto. Redirigiendo al dashboard...");
      } else {
        await register({ name, email, password } as RegisterRequest);
        setMessage("Registro completado. Redirigiendo al dashboard...");
      }
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error en el inicio de sesión");
    } finally {
      setLoading(false);
    }
  }, [authMode, email, name, password]);

  const authTitle = authMode === "login" ? "Inicia sesión en SpendLens" : "Regístrate en SpendLens";
  const submitLabel = authMode === "login" ? "Entrar" : "Registrar";
  const switchLabel = authMode === "login" ? "Crear cuenta" : "Ya tengo cuenta";

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Navbar />
      {isAuthenticated ? (
        <DashboardView onBackToLanding={handleLogout} onLogout={handleLogout} />
      ) : (
        <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center px-6 py-16">
          <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="space-y-6">
              <div className="rounded-[2rem] border border-white/10 bg-[#0F0F0F]/80 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.25)]">
                <p className="text-sm uppercase tracking-[0.3em] text-[#3BA3FF]">SpendLens</p>
                <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white">Accede a tu dashboard premium</h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
                  Usa tu cuenta para ver el panel financiero real, crear gastos y sincronizar datos seguro con JWT.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <p className="text-sm text-white/50">Dashboard seguro</p>
                    <p className="mt-2 font-medium text-white">Carga solo con token válido</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <p className="text-sm text-white/50">Cerrar sesión</p>
                    <p className="mt-2 font-medium text-white">El token se elimina localmente</p>
                  </div>
                </div>
              </div>
            </section>

            <Card className="p-6 shadow-[0_30px_90px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle>{authTitle}</CardTitle>
                    <CardDescription>
                      {authMode === "login"
                        ? "Introduce tu correo y contraseña para acceder."
                        : "Regístrate y accede a tu dashboard inmediato."}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {error ? (
                  <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                    {error}
                  </div>
                ) : null}
                {message ? (
                  <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                    {message}
                  </div>
                ) : null}

                {authMode === "register" ? (
                  <label className="block space-y-2 text-sm text-white/80">
                    <span>Nombre</span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Tu nombre"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#3BA3FF] focus:ring-2 focus:ring-[#3BA3FF]/20"
                    />
                  </label>
                ) : null}

                <label className="block space-y-2 text-sm text-white/80">
                  <span>Correo electrónico</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#3BA3FF] focus:ring-2 focus:ring-[#3BA3FF]/20"
                  />
                </label>

                <label className="block space-y-2 text-sm text-white/80">
                  <span>Contraseña</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="********"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#3BA3FF] focus:ring-2 focus:ring-[#3BA3FF]/20"
                  />
                </label>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button onClick={handleSubmit} disabled={loading} className="min-w-[140px]">
                    {loading ? "Cargando..." : submitLabel}
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleAuthModeChange(authMode === "login" ? "register" : "login")}
                    className="text-sm text-white/70 transition hover:text-white"
                  >
                    {switchLabel}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      )}
    </div>
  );
}
