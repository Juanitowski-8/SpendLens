import type { CategoryBreakdownItem, DashboardSummary, Expense } from "@/lib/api";
import { displayCategoryName, formatCurrencyCOP } from "@/lib/utils";

export type ExportRow = {
  fecha: string;
  comercio: string;
  categoria: string;
  montoCop: number;
  origen: string;
  descripcion: string;
};

export function expensesToExportRows(expenses: Expense[]): ExportRow[] {
  return expenses.map((expense) => ({
    fecha: expense.transactionDate,
    comercio: expense.merchant,
    categoria: displayCategoryName(expense.categoryName),
    montoCop: expense.amount,
    origen: expense.source,
    descripcion: expense.description ?? "",
  }));
}

function periodSlug(periodLabel: string): string {
  return periodLabel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportExpensesCsv(expenses: Expense[], periodLabel: string) {
  const rows = expensesToExportRows(expenses);
  const header = ["Fecha", "Comercio", "Categoría", "Monto COP", "Origen", "Descripción"];
  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.fecha,
        `"${row.comercio.replace(/"/g, '""')}"`,
        `"${row.categoria.replace(/"/g, '""')}"`,
        row.montoCop,
        row.origen,
        `"${row.descripcion.replace(/"/g, '""')}"`,
      ].join(","),
    ),
  ];

  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `spendlens-${periodSlug(periodLabel)}.csv`);
}

export async function exportExpensesExcel(expenses: Expense[], periodLabel: string) {
  const XLSX = await import("xlsx");
  const rows = expensesToExportRows(expenses);
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      Fecha: row.fecha,
      Comercio: row.comercio,
      Categoría: row.categoria,
      "Monto COP": row.montoCop,
      Origen: row.origen,
      Descripción: row.descripcion,
    })),
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Gastos");
  XLSX.writeFile(workbook, `spendlens-${periodSlug(periodLabel)}.xlsx`);
}

export function exportSummaryPdf(
  periodLabel: string,
  summary: DashboardSummary | null,
  expenses: Expense[],
  breakdown: CategoryBreakdownItem[],
) {
  const topCategories = breakdown
    .slice(0, 5)
    .map(
      (item) =>
        `<tr><td>${item.categoryName}</td><td>${formatCurrencyCOP(item.total)}</td><td>${item.count}</td></tr>`,
    )
    .join("");

  const sampleRows = expenses
    .slice(0, 15)
    .map(
      (expense) =>
        `<tr><td>${expense.transactionDate}</td><td>${expense.merchant}</td><td>${displayCategoryName(expense.categoryName)}</td><td>${formatCurrencyCOP(expense.amount)}</td></tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>SpendLens ${periodLabel}</title>
<style>
body{font-family:system-ui,sans-serif;padding:32px;color:#111}
h1{font-size:24px} table{width:100%;border-collapse:collapse;margin:16px 0}
th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
th{background:#f4f8ff}
</style></head><body>
<h1>SpendLens — Resumen ${periodLabel}</h1>
<p><strong>Total gastado:</strong> ${summary ? formatCurrencyCOP(summary.totalSpent) : "—"}</p>
<p><strong>Transacciones:</strong> ${summary?.expenseCount ?? 0}</p>
<p><strong>Promedio:</strong> ${summary ? formatCurrencyCOP(summary.averageExpense) : "—"}</p>
<h2>Top categorías</h2>
<table><thead><tr><th>Categoría</th><th>Total</th><th>#</th></tr></thead><tbody>${topCategories || "<tr><td colspan=3>Sin datos</td></tr>"}</tbody></table>
<h2>Muestra de transacciones</h2>
<table><thead><tr><th>Fecha</th><th>Comercio</th><th>Categoría</th><th>Monto</th></tr></thead><tbody>${sampleRows || "<tr><td colspan=4>Sin datos</td></tr>"}</tbody></table>
<p style="margin-top:24px;font-size:12px;color:#666">Generado por SpendLens. No constituye asesoría financiera.</p>
</body></html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Permite ventanas emergentes para exportar el PDF.");
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
