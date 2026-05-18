import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency }).format(amount);
}

/** Formato consistente para montos en COP: $ 32.400 COP */
export function formatCurrencyCOP(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) {
    return "--";
  }

  const formatted = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));

  return `$ ${formatted} COP`;
}

export function displayCategoryName(categoryName: string | null | undefined): string {
  if (!categoryName || categoryName === "Sin categoría") {
    return "Otros";
  }
  return categoryName;
}
