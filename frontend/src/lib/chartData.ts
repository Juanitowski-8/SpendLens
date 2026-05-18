import type { Expense } from "@/lib/api";

export type DailySpendPoint = { day: string; total: number };
export type StoreSpendPoint = { name: string; value: number };

function parseExpenseDay(transactionDate: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(transactionDate);
  if (!match) {
    return null;
  }
  const day = Number(match[3]);
  return Number.isNaN(day) ? null : day;
}

/** Totales por día del mes (1…último día) a partir de gastos reales. */
export function buildDailySpendData(expenses: Expense[], year: number, month: number): DailySpendPoint[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const totals = new Map<number, number>();

  for (const expense of expenses) {
    const day = parseExpenseDay(expense.transactionDate);
    if (day == null || day < 1 || day > daysInMonth) {
      continue;
    }
    totals.set(day, (totals.get(day) ?? 0) + expense.amount);
  }

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return {
      day: String(day).padStart(2, "0"),
      total: totals.get(day) ?? 0,
    };
  });
}

/** Top comercios por monto acumulado en el periodo. */
export function buildSpendByStoreData(expenses: Expense[], limit = 6): StoreSpendPoint[] {
  const byMerchant = new Map<string, number>();

  for (const expense of expenses) {
    const name = expense.merchant?.trim() || "Sin comercio";
    byMerchant.set(name, (byMerchant.get(name) ?? 0) + expense.amount);
  }

  return Array.from(byMerchant.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}
