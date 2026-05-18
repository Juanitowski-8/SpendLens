import type { ComponentType, ReactNode } from "react";
import {
  ChevronDown,
  FileText,
  Hash,
  LayoutGrid,
  List,
  Mail,
  MoreHorizontal,
  Download,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import {
  collectCategoryOptions,
  DEFAULT_EXPENSE_FILTERS,
  filterAndSortExpenses,
  hasActiveFilters,
  type ExpenseFilterState,
} from "@/lib/expenseFilters";
import { exportExpensesCsv, exportExpensesExcel, exportSummaryPdf } from "@/lib/export";
import { buildDailySpendData, buildSpendByStoreData } from "@/lib/chartData";
import {
  buildRecentPeriodOptions,
  type DashboardPeriod,
} from "@/lib/dashboardPeriods";
import { cn, displayCategoryName, formatCurrencyCOP } from "@/lib/utils";
import {
  getDashboardSummary,
  getCategoryBreakdown,
  getExpenses,
  getRecentExpenses,
  createExpense,
  importMockReceipts,
  importReceiptText,
  deleteExpense,
  updateExpense,
  syncGmail,
  deleteSuspiciousGmailTransactions,
  recategorizeGmailTransactions,
  getGmailStatus,
  disconnectGmail,
  connectGmail,
} from "@/lib/api";
import type { GmailStatus } from "@/lib/api";
import type {
  Expense,
  DashboardSummary,
  CategoryBreakdownItem,
} from "@/lib/api";

type DashboardViewProps = {
  onBackToLanding: () => void;
  onLogout: () => void;
};

type AlertItem = { id: string; tone: "success" | "error"; message: string };

const PERIOD_OPTIONS = buildRecentPeriodOptions(12);

const glassCard =
  "rounded-[1.75rem] border border-black/10 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)]";

const inputClass =
  "w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-[#3BA3FF] focus:ring-2 focus:ring-[#3BA3FF]/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-neutral-500";

export function DashboardView({ onBackToLanding }: DashboardViewProps) {
  const topRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>(PERIOD_OPTIONS[0]);
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [syncPhase, setSyncPhase] = useState<"idle" | "syncing" | "completed">("completed");

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [receiptText, setReceiptText] = useState("");
  const [parsingReceipt, setParsingReceipt] = useState(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("COP");
  const [transactionDateInput, setTransactionDateInput] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [descriptionInput, setDescriptionInput] = useState("");
  const [categoryIdInput, setCategoryIdInput] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [cleaningGmail, setCleaningGmail] = useState(false);
  const [recategorizingGmail, setRecategorizingGmail] = useState(false);
  const [gmailMaintenanceMessage, setGmailMaintenanceMessage] = useState<string | null>(null);
  const [gmailMaintenanceError, setGmailMaintenanceError] = useState<string | null>(null);

  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [disconnectingGmail, setDisconnectingGmail] = useState(false);

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editMerchant, setEditMerchant] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [expenseFilters, setExpenseFilters] = useState<ExpenseFilterState>(DEFAULT_EXPENSE_FILTERS);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const categoryOptions = useMemo(() => collectCategoryOptions(expenses), [expenses]);

  const filteredExpenses = useMemo(
    () => filterAndSortExpenses(expenses, expenseFilters),
    [expenses, expenseFilters],
  );

  const dailySpendChartData = useMemo(
    () => buildDailySpendData(expenses, selectedPeriod.year, selectedPeriod.month),
    [expenses, selectedPeriod.year, selectedPeriod.month],
  );

  const storeSpendChartData = useMemo(
    () => buildSpendByStoreData(expenses),
    [expenses],
  );

  const formatAmount = useCallback((value: number | null | undefined, currencyCode = "COP") => {
    if (currencyCode === "COP") {
      return formatCurrencyCOP(value);
    }
    if (value == null || Number.isNaN(value)) {
      return "--";
    }
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  const formatMetricAmount = useCallback(
    (value: number | null | undefined, currencyCode = "COP") => {
      if (value == null || Number.isNaN(value)) {
        return "--";
      }

      if (Math.abs(value) >= 1_000_000) {
        return new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: currencyCode,
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(value);
      }

      return formatAmount(value, currencyCode);
    },
    [formatAmount],
  );

  const loadDashboard = useCallback(async (period: DashboardPeriod = selectedPeriod) => {
    setLoading(true);
    setError(null);

    try {
      const { year, month } = period;
      const [summaryData, breakdownData, expensesData, recentData] = await Promise.all([
        getDashboardSummary(year, month),
        getCategoryBreakdown(year, month),
        getExpenses(year, month),
        getRecentExpenses(year, month),
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
  }, [selectedPeriod]);

  useEffect(() => {
    void loadDashboard(selectedPeriod);
  }, [selectedPeriod, loadDashboard]);

  const refreshGmailStatus = useCallback(async () => {
    try {
      const status = await getGmailStatus();
      setGmailStatus(status);
    } catch {
      setGmailStatus({ connected: false, gmailEmail: null, lastSyncedAt: null, createdAt: null });
    }
  }, []);

  useEffect(() => {
    void refreshGmailStatus();
  }, [refreshGmailStatus]);

  const handleSelectPeriod = (period: DashboardPeriod) => {
    setSelectedPeriod(period);
    setPeriodMenuOpen(false);
  };

  const scrollTo = (target: "top" | "table") => {
    const el = target === "top" ? topRef.current : tableRef.current;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCleanSuspiciousGmail = async () => {
    setGmailMaintenanceError(null);
    setGmailMaintenanceMessage(null);
    setCleaningGmail(true);
    try {
      const result = await deleteSuspiciousGmailTransactions();
      setGmailMaintenanceMessage(
        `Se limpiaron ${result.count} transacciones sospechosas importadas desde Gmail.`,
      );
      await loadDashboard();
      window.setTimeout(() => setGmailMaintenanceMessage(null), 6000);
    } catch (err) {
      setGmailMaintenanceError(
        err instanceof Error ? err.message : "Error al limpiar importaciones sospechosas",
      );
    } finally {
      setCleaningGmail(false);
    }
  };

  const handleRecategorizeGmail = async () => {
    setGmailMaintenanceError(null);
    setGmailMaintenanceMessage(null);
    setRecategorizingGmail(true);
    try {
      const result = await recategorizeGmailTransactions();
      setGmailMaintenanceMessage(`Se actualizaron ${result.count} categorías de Gmail.`);
      await loadDashboard();
      window.setTimeout(() => setGmailMaintenanceMessage(null), 6000);
    } catch (err) {
      setGmailMaintenanceError(
        err instanceof Error ? err.message : "Error al recategorizar transacciones Gmail",
      );
    } finally {
      setRecategorizingGmail(false);
    }
  };

  const handleSync = async () => {
    setSyncPhase("syncing");
    setSyncMessage(null);
    setSyncError(null);

    try {
      const result = await syncGmail();
      setSyncMessage(
        `Importados: ${result.importedCount} · Omitidos por baja confianza: ${result.skippedCount}`,
      );
      await loadDashboard();
      await refreshGmailStatus();
      setSyncPhase("completed");
    } catch (err) {
      setSyncPhase("idle");
      setSyncError(err instanceof Error ? err.message : "Error al sincronizar Gmail");
    }
  };

  const validateForm = (): string | null => {
    if (!merchant.trim()) return "El comercio es requerido.";
    const num = Number(amount);
    if (Number.isNaN(num) || num <= 0) return "El monto debe ser mayor a 0.";
    if (!transactionDateInput) return "La fecha es requerida.";
    return null;
  };

  const handleCreateExpense = async () => {
    setFormError(null);
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await createExpense({
        merchant: merchant.trim(),
        amount: Number(amount),
        currency: currency || "COP",
        transactionDate: transactionDateInput,
        description: descriptionInput || undefined,
        categoryId: categoryIdInput || undefined,
      });
      setSuccessMessage("Gasto creado correctamente.");
      await loadDashboard();
      setMerchant("");
      setAmount("");
      setCurrency("COP");
      setTransactionDateInput(new Date().toISOString().slice(0, 10));
      setDescriptionInput("");
      setCategoryIdInput(null);
      window.setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al crear gasto");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportReceipts = async () => {
    setImportError(null);
    setImportMessage(null);
    setImporting(true);
    try {
      const result = await importMockReceipts();
      setImportMessage(`Se importaron ${result.importedCount} recibos de prueba.`);
      await loadDashboard();
      window.setTimeout(() => setImportMessage(null), 5000);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Error al importar recibos");
    } finally {
      setImporting(false);
    }
  };

  const handleParseReceiptText = async () => {
    setParseError(null);
    setParseMessage(null);
    if (!receiptText.trim()) {
      setParseError("Pega el texto de un recibo antes de procesarlo.");
      return;
    }
    setParsingReceipt(true);
    try {
      const result = await importReceiptText({ text: receiptText.trim() });
      const created = result.createdTransactions[0];
      setParseMessage(
        created
          ? `Recibo procesado: ${created.merchant} por ${formatAmount(created.amount, created.currency)}.`
          : `Se procesaron ${result.importedCount} recibos desde texto.`,
      );
      setReceiptText("");
      await loadDashboard();
      window.setTimeout(() => setParseMessage(null), 5000);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Error al procesar el texto del recibo");
    } finally {
      setParsingReceipt(false);
    }
  };

  const handleDisconnectGmail = async () => {
    const confirmed = window.confirm("¿Desconectar Gmail? Tus gastos importados se conservarán.");
    if (!confirmed) return;

    setDisconnectingGmail(true);
    setSyncError(null);
    try {
      const result = await disconnectGmail();
      setSyncMessage(result.message);
      await refreshGmailStatus();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "No se pudo desconectar Gmail");
    } finally {
      setDisconnectingGmail(false);
    }
  };

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setEditMerchant(expense.merchant);
    setEditAmount(String(expense.amount));
    setEditDate(expense.transactionDate);
    setEditDescription(expense.description ?? "");
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingExpense) return;
    const num = Number(editAmount);
    if (!editMerchant.trim() || Number.isNaN(num) || num <= 0) {
      setEditError("Completa comercio y monto válido.");
      return;
    }

    setSavingEdit(true);
    setEditError(null);
    try {
      await updateExpense(editingExpense.id, {
        merchant: editMerchant.trim(),
        amount: num,
        currency: "COP",
        transactionDate: editDate,
        description: editDescription.trim() || undefined,
        categoryId: editingExpense.categoryId,
      });
      setEditingExpense(null);
      setSuccessMessage("Gasto actualizado correctamente.");
      await loadDashboard();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error al actualizar gasto");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    setDeleteError(null);
    setDeleteMessage(null);
    const confirmed = window.confirm(
      `¿Eliminar el gasto de ${expense.merchant} por ${formatAmount(expense.amount, expense.currency)}?`,
    );
    if (!confirmed) return;

    setDeletingExpenseId(expense.id);
    try {
      await deleteExpense(expense.id);
      setDeleteMessage("Gasto eliminado correctamente.");
      await loadDashboard();
      window.setTimeout(() => setDeleteMessage(null), 3000);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error al eliminar gasto");
    } finally {
      setDeletingExpenseId(null);
    }
  };

  const alerts = useMemo<AlertItem[]>(() => {
    const items: AlertItem[] = [];
    const push = (id: string, tone: "success" | "error", message: string | null) => {
      if (message) items.push({ id, tone, message });
    };
    push("error", "error", error);
    push("import-error", "error", importError);
    push("import", "success", importMessage);
    push("sync-error", "error", syncError);
    push("sync", "success", syncMessage);
    push("gmail-maint", "success", gmailMaintenanceMessage);
    push("gmail-maint-error", "error", gmailMaintenanceError);
    push("export", "success", exportMessage);
    push("delete-error", "error", deleteError);
    push("delete", "success", deleteMessage);
    push("parse-error", "error", parseError);
    push("parse", "success", parseMessage);
    return items;
  }, [
    deleteError,
    deleteMessage,
    error,
    importError,
    importMessage,
    parseError,
    parseMessage,
    syncError,
    syncMessage,
    gmailMaintenanceMessage,
    gmailMaintenanceError,
    exportMessage,
  ]);

  const handleExportCsv = () => {
    setExporting(true);
    setExportMessage(null);
    try {
      exportExpensesCsv(filteredExpenses, selectedPeriod.label);
      setExportMessage("Datos exportados en CSV.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al exportar");
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    setExportMessage(null);
    try {
      await exportExpensesExcel(filteredExpenses, selectedPeriod.label);
      setExportMessage("Datos exportados en Excel.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al exportar");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = () => {
    setExporting(true);
    setExportMessage(null);
    try {
      exportSummaryPdf(selectedPeriod.label, summary, filteredExpenses, categoryBreakdown);
      setExportMessage("Resumen PDF listo para imprimir o guardar.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al exportar PDF");
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => setExpenseFilters(DEFAULT_EXPENSE_FILTERS);

  const gmailCount = expenses.filter((e) => e.source === "GMAIL").length;
  const manualCount = expenses.filter((e) => e.source === "MANUAL").length;

  const syncStatusLabel =
    syncPhase === "syncing"
      ? "Sincronizando correos de Gmail…"
      : syncPhase === "completed"
        ? "Última sincronización lista"
        : "Listo para sincronizar";

  return (
    <div className="min-h-[calc(100vh-5rem)]">
      <div className="mx-auto flex max-w-7xl gap-5 px-4 py-6 lg:gap-8 lg:px-6 lg:py-8">
        <aside
          className={cn(
            "sticky top-24 hidden w-64 shrink-0 flex-col self-start lg:flex xl:w-72",
            glassCard,
            "p-5",
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#3BA3FF]">
            Aplicación
          </p>

          <nav className="mt-5 space-y-1.5 text-sm" aria-label="Navegación del panel">
            <SidebarLink active icon={LayoutGrid} label="Resumen" onClick={() => scrollTo("top")} />
            <SidebarLink icon={List} label="Transacciones" onClick={() => scrollTo("table")} />
          </nav>

          <Separator className="my-6 bg-black/10 dark:bg-white/10" />

          <div className="space-y-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
            <p>
              <span className="font-medium text-neutral-950 dark:text-white">1.</span> Conecta Gmail
              desde la barra superior.
            </p>
            <p>
              <span className="font-medium text-neutral-950 dark:text-white">2.</span> Pulsa{" "}
              <span className="text-[#3BA3FF]">Sincronizar Gmail</span> para importar recibos.
            </p>
            <p>
              <span className="font-medium text-neutral-950 dark:text-white">3.</span> Revisa totales
              y la tabla de movimientos.
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToLanding}
            className="mt-6 text-left text-xs font-medium text-neutral-500 transition hover:text-[#2F80FF] dark:text-neutral-400 dark:hover:text-[#3BA3FF]"
          >
            ← Volver al sitio
          </button>
        </aside>

        <main className="min-w-0 flex-1 space-y-8">
          <div ref={topRef} className="scroll-mt-28" />

          <header className="space-y-4">
            <div className="flex flex-wrap gap-2 lg:hidden">
              <Button variant="outline" size="sm" onClick={() => scrollTo("top")}>
                Resumen
              </Button>
              <Button variant="outline" size="sm" onClick={() => scrollTo("table")}>
                Transacciones
              </Button>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#3BA3FF]/25 bg-[#2F80FF]/10 px-3 py-1 text-xs font-medium text-[#3BA3FF]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Panel financiero
                </p>
                <h1 className="font-serif text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
                  Dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Resumen de tus gastos desde Gmail, entradas manuales y recibos procesados. Todo
                  en un solo lugar.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <span
                  className={cn(
                    "inline-flex h-2 w-2 rounded-full",
                    syncPhase === "syncing" ? "animate-pulse bg-[#3BA3FF]" : "bg-emerald-500",
                  )}
                  aria-hidden
                />
                {syncStatusLabel}
              </div>
            </div>
          </header>

          <section className={cn(glassCard, "p-5 sm:p-6")} aria-label="Estado Gmail">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-neutral-950 dark:text-white">Conexión Gmail</h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {gmailStatus?.connected
                    ? `Conectado como ${gmailStatus.gmailEmail ?? "—"}`
                    : "Gmail no conectado"}
                </p>
                {gmailStatus?.connected && gmailStatus.lastSyncedAt ? (
                  <p className="mt-1 text-xs text-neutral-500">
                    Última sincronización:{" "}
                    {new Date(gmailStatus.lastSyncedAt).toLocaleString("es-CO")}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {gmailStatus?.connected ? (
                  <Button
                    variant="outline"
                    className="rounded-full"
                    disabled={disconnectingGmail}
                    onClick={() => void handleDisconnectGmail()}
                  >
                    {disconnectingGmail ? "Desconectando…" : "Desconectar Gmail"}
                  </Button>
                ) : (
                  <Button
                    className="rounded-full bg-[#2F80FF] hover:bg-[#3BA3FF]"
                    onClick={() => void connectGmail()}
                  >
                    Conectar Gmail
                  </Button>
                )}
              </div>
            </div>
          </section>

          <section className={cn(glassCard, "p-5 sm:p-6")} aria-label="Acciones rápidas">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-neutral-950 dark:text-white">
                  Acciones del mes
                </h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  Periodo visible:{" "}
                  <span className="font-medium text-neutral-900 dark:text-white">{selectedPeriod.label}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu open={periodMenuOpen} onOpenChange={setPeriodMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="min-w-[132px] justify-between gap-2 rounded-full border-black/10 bg-white/70 dark:border-white/10 dark:bg-white/[0.06]"
                    >
                      {selectedPeriod.label}
                      <ChevronDown className="size-4 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {PERIOD_OPTIONS.map((period) => (
                      <DropdownMenuItem
                        key={period.label}
                        onClick={() => handleSelectPeriod(period)}
                        className={cn(
                          period.label === selectedPeriod.label && "bg-black/5 dark:bg-white/10",
                        )}
                      >
                        {period.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  onClick={handleSync}
                  disabled={syncPhase === "syncing"}
                  className="gap-2 rounded-full bg-[#2F80FF] px-5 shadow-[0_12px_40px_rgba(47,128,255,0.28)] hover:bg-[#3BA3FF]"
                >
                  <RefreshCw className={cn("size-4", syncPhase === "syncing" && "animate-spin")} />
                  {syncPhase === "syncing" ? "Sincronizando…" : "Sincronizar Gmail"}
                </Button>

                <DropdownMenu open={actionsMenuOpen} onOpenChange={setActionsMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full border-black/10 dark:border-white/10"
                      aria-label="Más acciones"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuItem
                      disabled={importing}
                      onClick={() => {
                        setActionsMenuOpen(false);
                        void handleImportReceipts();
                      }}
                    >
                      {importing ? "Importando…" : "Importar recibos de prueba"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={cleaningGmail}
                      onClick={() => {
                        setActionsMenuOpen(false);
                        void handleCleanSuspiciousGmail();
                      }}
                    >
                      {cleaningGmail ? "Limpiando…" : "Limpiar importaciones sospechosas"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={recategorizingGmail}
                      onClick={() => {
                        setActionsMenuOpen(false);
                        void handleRecategorizeGmail();
                      }}
                    >
                      {recategorizingGmail ? "Recategorizando…" : "Recategorizar Gmail"}
                    </DropdownMenuItem>
                    <div className="my-1 h-px bg-black/10 dark:bg-white/10" role="separator" />
                    <DropdownMenuItem disabled={exporting} onClick={() => { setActionsMenuOpen(false); handleExportCsv(); }}>
                      <Download className="mr-2 size-4" />
                      {exporting ? "Exportando…" : "Exportar CSV"}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={exporting} onClick={() => { setActionsMenuOpen(false); void handleExportExcel(); }}>
                      <Download className="mr-2 size-4" />
                      Exportar Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={exporting} onClick={() => { setActionsMenuOpen(false); handleExportPdf(); }}>
                      <Download className="mr-2 size-4" />
                      Exportar resumen PDF
                    </DropdownMenuItem>
                    <div className="my-1 h-px bg-black/10 dark:bg-white/10" role="separator" />
                    <DropdownMenuItem
                      onClick={() => {
                        setActionsMenuOpen(false);
                        scrollTo("table");
                      }}
                    >
                      Ver todas las transacciones
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </section>

          {alerts.length > 0 ? <AlertStack items={alerts} /> : null}

          <section aria-label="Indicadores principales">
            <SectionTitle
              title="Resumen del periodo"
              description="Totales calculados desde tu base de gastos real."
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Wallet}
                title="Total gastado"
                value={
                  summary
                    ? formatMetricAmount(summary.totalSpent, summary.currency)
                    : loading
                      ? "…"
                      : "--"
                }
                fullValue={summary ? formatAmount(summary.totalSpent, summary.currency) : undefined}
                hint={`${summary?.currency ?? "COP"} · ${selectedPeriod.label}`}
              />
              <MetricCard
                icon={Hash}
                title="Transacciones"
                value={summary ? String(summary.expenseCount) : loading ? "…" : "--"}
                hint={`${gmailCount} Gmail · ${manualCount} manuales`}
              />
              <MetricCard
                icon={TrendingUp}
                title="Promedio por gasto"
                value={
                  summary
                    ? formatMetricAmount(summary.averageExpense, summary.currency)
                    : loading
                      ? "…"
                      : "--"
                }
                fullValue={summary ? formatAmount(summary.averageExpense, summary.currency) : undefined}
                hint="Monto medio del periodo"
              />
              <MetricCard
                icon={Mail}
                title="Origen principal"
                value={gmailCount >= manualCount ? "Gmail" : "Manual"}
                hint={
                  recentExpenses.length > 0
                    ? `${recentExpenses.length} movimientos recientes`
                    : "Sin movimientos recientes"
                }
              />
            </div>
          </section>

          <section aria-label="Gráficos" className="grid gap-6 xl:grid-cols-3">
            <Card className={cn("relative overflow-hidden xl:col-span-2", glassCard, "border-0 bg-transparent shadow-none")}>
              <CardHeader className="border-b border-black/10 pb-4 dark:border-white/10">
                <CardTitle className="text-base font-semibold">Gastos por día</CardTitle>
                <CardDescription>
                  Totales diarios de {selectedPeriod.label} según tus gastos registrados.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <p className="py-16 text-center text-sm text-neutral-500">Cargando gráfico…</p>
                ) : (
                  <DailySpendChart data={dailySpendChartData} />
                )}
              </CardContent>
            </Card>

            <Card className={cn("relative overflow-hidden", glassCard, "border-0 bg-transparent shadow-none")}>
              <CardHeader className="border-b border-black/10 pb-4 dark:border-white/10">
                <CardTitle className="text-base font-semibold">Por comercio</CardTitle>
                <CardDescription>Top comercios del periodo por monto total.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <p className="py-16 text-center text-sm text-neutral-500">Cargando gráfico…</p>
                ) : (
                  <StoreSpendChart data={storeSpendChartData} />
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2" aria-label="Detalle y categorías">
            <Card className={cn(glassCard, "border-0 bg-transparent shadow-none")}>
              <CardHeader>
                <CardTitle className="text-base">Por categoría</CardTitle>
                <CardDescription>Distribución real desde el backend.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-neutral-500">Cargando categorías…</p>
                ) : categoryBreakdown.length === 0 ? (
                  <p className="text-sm text-neutral-500">Aún no hay categorías asignadas.</p>
                ) : (
                  <div className="space-y-3">
                    {categoryBreakdown.map((item) => (
                      <div
                        key={item.categoryName}
                        className="flex items-center justify-between rounded-2xl border border-black/10 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]"
                      >
                        <div>
                          <p className="font-medium text-neutral-950 dark:text-white">{item.categoryName}</p>
                          <p className="text-xs text-neutral-500">
                            {item.count} gasto{item.count === 1 ? "" : "s"}
                          </p>
                        </div>
                        <p className="text-sm font-semibold tabular-nums text-neutral-950 dark:text-white">
                          {formatAmount(item.total, summary?.currency ?? "COP")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={cn(glassCard, "border-0 bg-transparent shadow-none")}>
              <CardHeader>
                <CardTitle className="text-base">Últimos movimientos</CardTitle>
                <CardDescription>Los 5 gastos más recientes de tu cuenta.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-neutral-500">Cargando…</p>
                ) : recentExpenses.length === 0 ? (
                  <p className="text-sm text-neutral-500">No hay gastos recientes.</p>
                ) : (
                  <ul className="space-y-3">
                    {recentExpenses.slice(0, 5).map((expense) => (
                      <li
                        key={expense.id}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-black/10 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-neutral-950 dark:text-white">
                            {expense.merchant}
                          </p>
                          <p className="text-xs text-neutral-500">{expense.transactionDate}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums">
                            {formatAmount(expense.amount, expense.currency)}
                          </p>
                          <SourceBadge source={expense.source} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          <section aria-label="Registrar gastos" className="grid gap-6 lg:grid-cols-2">
            <Card className={cn(glassCard, "border-0 bg-transparent shadow-none")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-4 text-[#3BA3FF]" />
                  Procesar recibo (texto)
                </CardTitle>
                <CardDescription>
                  Pega el contenido de un correo o recibo. El sistema extrae comercio, monto y fecha.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  aria-label="Texto del recibo"
                  placeholder="Ejemplo: Recibo Uber — Total 35.000 COP — 17 mayo 2026"
                  value={receiptText}
                  onChange={(e) => setReceiptText(e.target.value)}
                  className={cn(inputClass, "min-h-28 resize-y")}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleParseReceiptText}
                    disabled={parsingReceipt}
                    className="rounded-full bg-[#2F80FF] hover:bg-[#3BA3FF]"
                  >
                    {parsingReceipt ? "Procesando…" : "Procesar recibo"}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      setReceiptText("");
                      setParseError(null);
                      setParseMessage(null);
                    }}
                    disabled={parsingReceipt}
                  >
                    Limpiar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={cn(glassCard, "border-0 bg-transparent shadow-none")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="size-4 text-[#3BA3FF]" />
                  Gasto manual
                </CardTitle>
                <CardDescription>Registra un gasto que no venga de Gmail.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Comercio">
                    <input
                      aria-label="Comercio"
                      placeholder="Ej. Éxito, Uber…"
                      value={merchant}
                      onChange={(e) => setMerchant(e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Monto">
                    <input
                      aria-label="Monto"
                      placeholder="35000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={inputClass}
                      inputMode="decimal"
                    />
                  </Field>
                  <Field label="Moneda">
                    <input
                      aria-label="Moneda"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Fecha">
                    <input
                      aria-label="Fecha"
                      type="date"
                      value={transactionDateInput}
                      onChange={(e) => setTransactionDateInput(e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Descripción (opcional)" className="sm:col-span-2">
                    <input
                      aria-label="Descripción"
                      placeholder="Notas del gasto"
                      value={descriptionInput}
                      onChange={(e) => setDescriptionInput(e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
                {formError ? <p className="text-sm text-red-500 dark:text-red-300">{formError}</p> : null}
                {successMessage ? (
                  <p className="text-sm text-emerald-600 dark:text-emerald-300">{successMessage}</p>
                ) : null}
                <Button
                  onClick={handleCreateExpense}
                  disabled={submitting}
                  className="rounded-full bg-[#2F80FF] hover:bg-[#3BA3FF]"
                >
                  {submitting ? "Guardando…" : "Crear gasto"}
                </Button>
              </CardContent>
            </Card>
          </section>

          <section ref={tableRef} className="scroll-mt-28" aria-label="Tabla de transacciones">
            <SectionTitle
              title="Todas las transacciones"
              description={`${filteredExpenses.length} de ${expenses.length} gastos visibles. Filtra, ordena o exporta desde el menú de acciones.`}
            />
            <div className="mt-4 space-y-3 rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <Field label="Buscar">
                  <input
                    aria-label="Buscar transacciones"
                    placeholder="Comercio, categoría…"
                    value={expenseFilters.searchText}
                    onChange={(e) => setExpenseFilters((f) => ({ ...f, searchText: e.target.value }))}
                    className={inputClass}
                  />
                </Field>
                <Field label="Categoría">
                  <select
                    aria-label="Filtrar por categoría"
                    value={expenseFilters.category}
                    onChange={(e) => setExpenseFilters((f) => ({ ...f, category: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="ALL">Todas</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Origen">
                  <select
                    aria-label="Filtrar por origen"
                    value={expenseFilters.source}
                    onChange={(e) =>
                      setExpenseFilters((f) => ({ ...f, source: e.target.value as ExpenseFilterState["source"] }))
                    }
                    className={inputClass}
                  >
                    <option value="ALL">Todos</option>
                    <option value="GMAIL">Gmail</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </Field>
                <Field label="Monto mín.">
                  <input
                    aria-label="Monto mínimo"
                    type="number"
                    placeholder="0"
                    value={expenseFilters.minAmount}
                    onChange={(e) => setExpenseFilters((f) => ({ ...f, minAmount: e.target.value }))}
                    className={inputClass}
                  />
                </Field>
                <Field label="Monto máx.">
                  <input
                    aria-label="Monto máximo"
                    type="number"
                    placeholder="Sin límite"
                    value={expenseFilters.maxAmount}
                    onChange={(e) => setExpenseFilters((f) => ({ ...f, maxAmount: e.target.value }))}
                    className={inputClass}
                  />
                </Field>
                <Field label="Ordenar">
                  <select
                    aria-label="Ordenar transacciones"
                    value={expenseFilters.sort}
                    onChange={(e) =>
                      setExpenseFilters((f) => ({ ...f, sort: e.target.value as ExpenseFilterState["sort"] }))
                    }
                    className={inputClass}
                  >
                    <option value="date-desc">Fecha (reciente)</option>
                    <option value="date-asc">Fecha (antigua)</option>
                    <option value="amount-desc">Monto (mayor)</option>
                    <option value="amount-asc">Monto (menor)</option>
                  </select>
                </Field>
              </div>
              {hasActiveFilters(expenseFilters) ? (
                <Button variant="outline" size="sm" className="rounded-full" onClick={clearFilters}>
                  <X className="mr-1 size-3.5" />
                  Limpiar filtros
                </Button>
              ) : null}
            </div>
            <Card className={cn("mt-4 overflow-hidden", glassCard, "border-0 bg-transparent p-0 shadow-none")}>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-black/10 hover:bg-transparent dark:border-white/10">
                        <TableHead className="text-neutral-600 dark:text-neutral-400">Fecha</TableHead>
                        <TableHead className="text-neutral-600 dark:text-neutral-400">Comercio</TableHead>
                        <TableHead className="hidden sm:table-cell text-neutral-600 dark:text-neutral-400">
                          Categoría
                        </TableHead>
                        <TableHead className="text-neutral-600 dark:text-neutral-400">Monto</TableHead>
                        <TableHead className="hidden md:table-cell text-neutral-600 dark:text-neutral-400">
                          Origen
                        </TableHead>
                        <TableHead className="text-right text-neutral-600 dark:text-neutral-400">
                          Acción
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-12 text-center text-neutral-500">
                            Cargando transacciones…
                          </TableCell>
                        </TableRow>
                      ) : expenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-12 text-center text-neutral-500">
                            Aún no tienes gastos este mes. Crea un gasto o sincroniza Gmail.
                          </TableCell>
                        </TableRow>
                      ) : filteredExpenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-12 text-center text-neutral-500">
                            Ningún gasto coincide con los filtros.{" "}
                            <button type="button" className="text-[#2F80FF] underline" onClick={clearFilters}>
                              Limpiar filtros
                            </button>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredExpenses.map((expense) => (
                          <TableRow
                            key={expense.id}
                            className="border-black/10 dark:border-white/10"
                          >
                            <TableCell className="whitespace-nowrap text-neutral-600 dark:text-neutral-300">
                              {expense.transactionDate}
                            </TableCell>
                            <TableCell className="max-w-[180px] truncate font-medium text-neutral-950 dark:text-white">
                              {expense.merchant}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                                  expense.categoryName
                                    ? "bg-[#2F80FF]/10 text-[#2F80FF] dark:bg-[#3BA3FF]/15 dark:text-[#3BA3FF]"
                                    : "bg-black/5 text-neutral-500 dark:bg-white/10 dark:text-neutral-400",
                                )}
                              >
                                {displayCategoryName(expense.categoryName)}
                              </span>
                            </TableCell>
                            <TableCell className="font-semibold tabular-nums text-neutral-950 dark:text-white">
                              {formatAmount(expense.amount, expense.currency)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <SourceBadge source={expense.source} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full"
                                  onClick={() => openEditExpense(expense)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full"
                                  onClick={() => handleDeleteExpense(expense)}
                                  disabled={deletingExpenseId === expense.id}
                                >
                                  {deletingExpenseId === expense.id ? "…" : "Eliminar"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>

          {editingExpense ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
              <div className={cn(glassCard, "w-full max-w-lg p-6")}>
                <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">Editar gasto</h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{editingExpense.merchant}</p>
                <div className="mt-4 space-y-3">
                  <Field label="Comercio">
                    <input className={inputClass} value={editMerchant} onChange={(e) => setEditMerchant(e.target.value)} />
                  </Field>
                  <Field label="Monto (COP)">
                    <input className={inputClass} type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                  </Field>
                  <Field label="Fecha">
                    <input className={inputClass} type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                  </Field>
                  <Field label="Descripción">
                    <input className={inputClass} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                  </Field>
                  {editError ? <p className="text-sm text-red-600">{editError}</p> : null}
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="outline" className="rounded-full" onClick={() => setEditingExpense(null)}>
                    Cancelar
                  </Button>
                  <Button className="rounded-full bg-[#2F80FF]" disabled={savingEdit} onClick={() => void handleSaveEdit()}>
                    {savingEdit ? "Guardando…" : "Guardar"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <footer className="mt-8 rounded-[1.75rem] border border-black/10 bg-white/60 px-5 py-4 text-sm leading-relaxed text-neutral-600 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-400">
            <p>
              <span className="font-medium text-neutral-900 dark:text-white">Consejo Gmail:</span> mantén
              tu bandeja organizada (recibos reales separados de promociones y newsletters) para reducir
              duplicados, montos erróneos y comercios repetidos al sincronizar.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-neutral-950 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
    </div>
  );
}

function AlertStack({ items }: { items: AlertItem[] }) {
  return (
    <div className="space-y-2" role="status" aria-live="polite">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm",
            item.tone === "success"
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              : "border-red-500/25 bg-red-500/10 text-red-800 dark:text-red-200",
          )}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{label}</span>
      {children}
    </label>
  );
}

function SourceBadge({ source }: { source: string }) {
  const isGmail = source === "GMAIL";
  return (
    <Badge
      variant="outline"
      className={cn(
        "mt-1 text-[10px] uppercase tracking-wide",
        isGmail
          ? "border-[#3BA3FF]/40 text-[#3BA3FF]"
          : "border-neutral-400/40 text-neutral-500",
      )}
    >
      {isGmail ? "Gmail" : source === "MANUAL" ? "Manual" : source}
    </Badge>
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
        "flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left text-sm transition-all",
        active
          ? "border-[#2F80FF]/35 bg-[#2F80FF]/10 font-medium text-neutral-950 shadow-sm dark:text-white"
          : "border-transparent text-neutral-600 hover:border-black/10 hover:bg-black/[0.03] dark:text-neutral-400 dark:hover:border-white/10 dark:hover:bg-white/[0.04]",
      )}
    >
      <Icon className="size-4 shrink-0 text-[#3BA3FF]" aria-hidden />
      {label}
    </button>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  hint,
  fullValue,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  value: string;
  hint: string;
  fullValue?: string;
}) {
  return (
    <div className={cn(glassCard, "p-5 transition hover:-translate-y-0.5 hover:shadow-[0_28px_90px_rgba(47,128,255,0.12)]")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{title}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F80FF]/10 text-[#3BA3FF]">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p
        className="mt-3 font-serif text-2xl font-semibold tracking-tight text-neutral-950 tabular-nums dark:text-white sm:text-3xl"
        title={fullValue}
      >
        {value}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-500">{hint}</p>
    </div>
  );
}
