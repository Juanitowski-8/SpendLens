export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

export type Expense = {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  merchant: string;
  amount: number;
  currency: string;
  transactionDate: string;
  description: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type DashboardSummary = {
  totalSpent: number;
  expenseCount: number;
  averageExpense: number;
  currency: string;
};

export type CategoryBreakdownItem = {
  categoryName: string;
  total: number;
  count: number;
};

export type CreateExpensePayload = {
  merchant: string;
  amount: number;
  currency: string;
  transactionDate: string;
  description?: string | null;
  categoryId?: string | null;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  const message = await getErrorMessage(response);
  throw new Error(`API request failed: ${message}`);
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.text();
    return body ? `${response.status} ${response.statusText}: ${body}` : `${response.status} ${response.statusText}`;
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

export async function getExpenses(): Promise<Expense[]> {
  const response = await fetch(`${API_BASE_URL}/api/auth/expenses`, {
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<Expense[]>(response);
}

export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  const response = await fetch(`${API_BASE_URL}/api/auth/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<Expense>(response);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch(`${API_BASE_URL}/api/auth/dashboard/summary`, {
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<DashboardSummary>(response);
}

export async function getCategoryBreakdown(): Promise<CategoryBreakdownItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/auth/dashboard/category-breakdown`, {
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<CategoryBreakdownItem[]>(response);
}

export async function getRecentExpenses(): Promise<Expense[]> {
  const response = await fetch(`${API_BASE_URL}/api/auth/dashboard/recent-expenses`, {
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<Expense[]>(response);
}
