import type { Expense } from "@/lib/api";
import { displayCategoryName } from "@/lib/utils";

export type SourceFilter = "ALL" | "MANUAL" | "GMAIL";

export type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export type ExpenseFilterState = {
  searchText: string;
  category: string;
  source: SourceFilter;
  minAmount: string;
  maxAmount: string;
  sort: SortOption;
};

export const DEFAULT_EXPENSE_FILTERS: ExpenseFilterState = {
  searchText: "",
  category: "ALL",
  source: "ALL",
  minAmount: "",
  maxAmount: "",
  sort: "date-desc",
};

export function filterAndSortExpenses(expenses: Expense[], filters: ExpenseFilterState): Expense[] {
  const search = filters.searchText.trim().toLowerCase();
  const min = filters.minAmount ? Number(filters.minAmount) : null;
  const max = filters.maxAmount ? Number(filters.maxAmount) : null;

  let result = expenses.filter((expense) => {
    if (search) {
      const haystack = [
        expense.merchant,
        expense.description ?? "",
        displayCategoryName(expense.categoryName),
        expense.source,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }

    if (filters.category !== "ALL") {
      const categoryName = displayCategoryName(expense.categoryName);
      if (categoryName !== filters.category) {
        return false;
      }
    }

    if (filters.source !== "ALL" && expense.source !== filters.source) {
      return false;
    }

    if (min != null && !Number.isNaN(min) && expense.amount < min) {
      return false;
    }

    if (max != null && !Number.isNaN(max) && expense.amount > max) {
      return false;
    }

    return true;
  });

  result = [...result].sort((left, right) => {
    switch (filters.sort) {
      case "date-asc":
        return left.transactionDate.localeCompare(right.transactionDate);
      case "amount-desc":
        return right.amount - left.amount;
      case "amount-asc":
        return left.amount - right.amount;
      case "date-desc":
      default:
        return right.transactionDate.localeCompare(left.transactionDate);
    }
  });

  return result;
}

export function collectCategoryOptions(expenses: Expense[]): string[] {
  const categories = new Set<string>();
  for (const expense of expenses) {
    categories.add(displayCategoryName(expense.categoryName));
  }
  return Array.from(categories).sort((a, b) => a.localeCompare(b, "es"));
}

export function hasActiveFilters(filters: ExpenseFilterState): boolean {
  return (
    filters.searchText.trim() !== "" ||
    filters.category !== "ALL" ||
    filters.source !== "ALL" ||
    filters.minAmount !== "" ||
    filters.maxAmount !== "" ||
    filters.sort !== "date-desc"
  );
}
