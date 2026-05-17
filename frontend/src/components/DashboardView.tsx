import type { ComponentType } from "react";
import { ChevronDown, LayoutGrid, List, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { DailySpendChart, StoreSpendChart } from "@/components/SpendCharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getDashboardSummary,
  getCategoryBreakdown,
  getExpenses,
  getRecentExpenses,
  createExpense,
} from "@/lib/api";
import type { Expense, DashboardSummary, CategoryBreakdownItem, CreateExpensePayload } from "@/lib/api";
import { EMAILS_SYNCED } from "@/mockData";

type DashboardViewProps = {
  onBackToLanding: () => void;
};

export function DashboardView({ onBackToLanding }: DashboardViewProps) {
  const topRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [month, setMonth] = useState("Mayo 2026");
  const [syncPhase, setSyncPhase] = useState<"idle" | "syncing" | "completed">("completed");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncLabel =
    syncPhase === "syncing"
      ? "Sincronizando…"
      : syncPhase === "completed"
        ? "Última sincronización completada"
        : "Listo para sincronizar";

  const handleSync = () => {
    setSyncPhase("syncing");
    window.setTimeout(() => setSyncPhase("completed"), 1800);
  };

  const formatAmount = (value: number | null | undefined, currency = "COP") => {
    if (value == null || Number.isNaN(value)) {
      return "--";
    }

    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryData, breakdownData, expensesData, recentData] = await Promise.all([
        getDashboardSummary(),
        getCategoryBreakdown(),
        getExpenses(),
        getRecentExpenses(),
      ]);

      setSummary(summaryData);
      setCategoryBreakdown(breakdownData);
      setExpenses(expensesData);
      setRecentExpenses(recentData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar el dashboard";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const scrollTo = (target: "top" | "table") => {
    const el = target === "top" ? topRef.current : tableRef.current;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const chartBand =
    "from-transparent via-[#2F80FF]/40 to-transparent dark:from-transparent dark:via-[#3BA3FF]/65 dark:to-transparent";

  // Create expense form state
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("COP");
  const [transactionDateInput, setTransactionDateInput] = useState(() => new Date().toISOString().slice(0, 10));
  const [descriptionInput, setDescriptionInput] = useState("");
  const [categoryIdInput, setCategoryIdInput] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const validateForm = (): string | null => {
    if (!merchant || merchant.trim() === "") return "Merchant is required.";
    const num = Number(amount);
    if (Number.isNaN(num) || num <= 0) return "Amount must be a number greater than 0.";
    if (!transactionDateInput) return "Transaction date is required.";
    return null;
  };

  const handleCreateExpense = async () => {
    setFormError(null);
    const v = validateForm();
    if (v) {
      setFormError(v);
      return;
    }

    const payload: CreateExpensePayload = {
      merchant: merchant.trim(),
      amount: Number(amount),
      currency: currency || "COP",
      transactionDate: transactionDateInput,
      description: descriptionInput || undefined,
      categoryId: categoryIdInput || undefined,
    };

    setSubmitting(true);
    try {
      await createExpense(payload);
      setSuccessMessage("Gasto creado correctamente.");
      // refresh data
      await loadDashboard();
      // clear form
      setMerchant("");
      setAmount("");
      setCurrency("COP");
      setTransactionDateInput(new Date().toISOString().slice(0, 10));
      setDescriptionInput("");
      setCategoryIdInput(null);
      window.setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear gasto";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#030303] text-white">
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        <aside className="sticky top-24 hidden w-72 shrink-0 rounded-[2rem] border border-white/10 bg-[#0F0F0F]/90 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.25)] lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
            Aplicación
          </p>
          <nav className="mt-6 space-y-1 text-sm">
            <SidebarLink active icon={LayoutGrid} label="Dashboard" onClick={() => scrollTo("top")} />
            <SidebarLink icon={List} label="Transacciones" onClick={() => scrollTo("table")} />
          </nav>
          <Separator className="my-8 bg-black/10 transition-colors duration-300 dark:bg-white/10" />
          <button
            type="button"
            onClick={onBackToLanding}
            className="text-xs text-neutral-500 transition-colors hover:text-[#006DFF] dark:text-[#737373] dark:hover:text-[#3BA3FF]"
          >
            Volver al sitio
          </button>
        </aside>

        <div className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <div ref={topRef} className="scroll-mt-28" />

          <div className="mb-8 flex flex-col gap-4 border-b border-black/10 pb-8 transition-colors duration-300 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2 lg:hidden">
                <Button variant="outline" size="sm" onClick={() => scrollTo("top")}>
                  Resumen
                </Button>
                <Button variant="outline" size="sm" onClick={() => scrollTo("table")}>
                  Tabla
                </Button>
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950 transition-colors duration-300 dark:text-[#F5F5F5] sm:text-3xl">
                Dashboard
              </h1>
              <p className="mt-2 max-w-2xl leading-7 text-neutral-600 transition-colors duration-300 dark:text-[#A3A3A3]">
                Tu mes financiero, resumido desde Gmail.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="min-w-[140px] justify-between gap-2">
                    {month}
                    <ChevronDown className="size-4 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setMonth("Mayo 2026")}>Mayo 2026</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMonth("Abril 2026")}>Abril 2026</DropdownMenuItem>
                  <DropdownMenuItem disabled>Marzo 2026</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleSync} className="gap-2">
                <RefreshCw className={cn("size-4", syncPhase === "syncing" && "animate-spin")} />
                Sincronizar Gmail
              </Button>
            </div>
          </div>

          <div className="space-y-10">
            {error ? (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Total gastado" value={summary ? formatAmount(summary.totalSpent, summary.currency) : loading ? "Cargando..." : "--"} hint={summary ? `${summary.currency} · Mayo 2026` : "Backend"} />
              <MetricCard title="Número de gastos" value={summary ? String(summary.expenseCount) : loading ? "Cargando..." : "--"} hint="Desde el backend" />
              <MetricCard title="Promedio por gasto" value={summary ? formatAmount(summary.averageExpense, summary.currency) : loading ? "Cargando..." : "--"} hint="Gasto promedio" />
              <MetricCard title="Moneda" value={summary ? summary.currency : loading ? "Cargando..." : "COP"} hint="Moneda principal" />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="relative overflow-hidden xl:col-span-2">
                <div className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r ${chartBand}`} aria-hidden />
                <CardHeader className="border-b border-black/10 pt-7 transition-colors duration-300 dark:border-white/10">
                  <CardTitle className="text-base">Gastos por día</CardTitle>
                  <CardDescription>Distribución simple del periodo seleccionado.</CardDescription>
                </CardHeader>
                <CardContent>
                  <DailySpendChart />
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden">
                <div className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r ${chartBand}`} aria-hidden />
                <CardHeader className="border-b border-black/10 pt-7 transition-colors duration-300 dark:border-white/10">
                  <CardTitle className="text-base">Gasto por tienda</CardTitle>
                  <CardDescription>Top comercios detectados.</CardDescription>
                </CardHeader>
                <CardContent>
                  <StoreSpendChart />
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Puntos por categoría</CardTitle>
                <CardDescription>Resumen real desde el backend.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-neutral-500">Cargando categorías…</p>
                ) : categoryBreakdown.length === 0 ? (
                  <p className="text-sm text-neutral-500">No hay datos de categorías disponibles.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {categoryBreakdown.map((item) => (
                      <div key={item.categoryName} className="rounded-2xl border border-white/10 bg-[#0F0F0F]/90 p-4">
                        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">{item.categoryName}</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{formatAmount(item.total, summary?.currency ?? "COP")}</p>
                        <p className="mt-1 text-sm text-neutral-500">{item.count} gasto{item.count === 1 ? "" : "s"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Última sincronización</CardTitle>
                <CardDescription>{syncLabel}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-neutral-600 dark:text-[#A3A3A3]">
                <p className="font-medium text-neutral-950 dark:text-[#F5F5F5]">
                  {EMAILS_SYNCED} correos revisados · {recentExpenses.length} gastos recientes
                </p>
                <p className="mt-2 text-xs text-neutral-500 transition-colors duration-300 dark:text-[#737373]">
                  Los totales son datos mock para validación de UI.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Crear gasto manual</CardTitle>
                <CardDescription>Agregar un gasto manual rápidamente.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    aria-label="Merchant"
                    placeholder="Tienda o comercio"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="rounded-md border border-white/10 bg-[#0F0F0F]/80 p-2 text-white"
                  />
                  <input
                    aria-label="Amount"
                    placeholder="Monto"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="rounded-md border border-white/10 bg-[#0F0F0F]/80 p-2 text-white"
                    inputMode="decimal"
                  />
                  <input
                    aria-label="Currency"
                    placeholder="Moneda"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="rounded-md border border-white/10 bg-[#0F0F0F]/80 p-2 text-white"
                  />
                  <input
                    aria-label="Transaction Date"
                    type="date"
                    value={transactionDateInput}
                    onChange={(e) => setTransactionDateInput(e.target.value)}
                    className="rounded-md border border-white/10 bg-[#0F0F0F]/80 p-2 text-white"
                  />
                  <input
                    aria-label="CategoryId (opcional)"
                    placeholder="CategoryId (opcional)"
                    value={categoryIdInput ?? ""}
                    onChange={(e) => setCategoryIdInput(e.target.value || null)}
                    className="rounded-md border border-white/10 bg-[#0F0F0F]/80 p-2 text-white"
                  />
                  <input
                    aria-label="Description"
                    placeholder="Descripción (opcional)"
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    className="rounded-md border border-white/10 bg-[#0F0F0F]/80 p-2 text-white"
                  />

                </div>
                {formError && <p className="mt-3 text-sm text-red-400">{formError}</p>}
                {successMessage && <p className="mt-3 text-sm text-green-400">{successMessage}</p>}
                <div className="mt-3 flex gap-2">
                  <Button onClick={handleCreateExpense} disabled={submitting}>
                    {submitting ? "Guardando…" : "Crear gasto"}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setMerchant(""); setAmount(""); setCurrency("COP"); setTransactionDateInput(new Date().toISOString().slice(0,10)); setDescriptionInput(""); setCategoryIdInput(null); setFormError(null);
                  }}>
                    Limpiar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div ref={tableRef} className="scroll-mt-28">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tabla de transacciones</CardTitle>
                  <CardDescription>Columnas listas para ordenar y filtrar en versiones futuras.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-black/10 hover:bg-transparent dark:border-white/10">
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tienda</TableHead>
                          <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead className="hidden md:table-cell">Origen</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="py-8 text-center text-neutral-500">
                              Cargando transacciones…
                            </TableCell>
                          </TableRow>
                        ) : expenses.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="py-8 text-center text-neutral-500">
                              No se encontraron gastos.
                            </TableCell>
                          </TableRow>
                        ) : (
                          expenses.map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell className="whitespace-nowrap text-neutral-600 dark:text-[#A3A3A3]">{expense.transactionDate}</TableCell>
                              <TableCell className="font-medium">{expense.merchant}</TableCell>
                              <TableCell className="hidden text-neutral-600 sm:table-cell dark:text-[#A3A3A3]">
                                {expense.categoryName ?? "Sin categoría"}
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatAmount(expense.amount, expense.currency)}
                              </TableCell>
                              <TableCell className="hidden text-neutral-600 md:table-cell dark:text-[#A3A3A3]">{expense.source}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">Cargado</Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-all duration-300",
        active
          ? "border-[#2F80FF]/35 bg-[#2F80FF]/10 text-neutral-950 shadow-sm dark:border-[#3BA3FF]/35 dark:bg-[#2F80FF]/15 dark:text-[#F5F5F5] dark:shadow-[0_0_24px_rgba(47,128,255,0.12)]"
          : "border-transparent text-neutral-600 hover:border-black/10 hover:bg-black/[0.03] hover:text-[#006DFF] dark:text-[#A3A3A3] dark:hover:border-white/10 dark:hover:bg-white/[0.04] dark:hover:text-[#3BA3FF]",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </button>
  );
}

function MetricCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-neutral-500 transition-colors duration-300 dark:text-[#737373]">{hint}</p>
      </CardContent>
    </Card>
  );
}
