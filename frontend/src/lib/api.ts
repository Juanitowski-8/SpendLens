/** En producción (Vercel) define VITE_API_URL = URL pública del backend (Render). */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8081" : "");

export const isApiConfigured = API_BASE_URL.length > 0;

function ensureApiConfigured(): void {
  if (!isApiConfigured) {
    throw new Error(
      "Falta VITE_API_URL en Vercel. Añádela apuntando a tu backend en Render y vuelve a desplegar.",
    );
  }
}

/** Ruta del endpoint autenticado que devuelve la URL de Google (usar `connectGmail()`). */
export function getGmailConnectUrl(): string {
  return `${API_BASE_URL}/api/auth/gmail/connect-url`;
}

export type GmailSyncResult = {
  importedCount: number;
  skippedCount: number;
  createdTransactions: Expense[];
  skippedReasons?: Record<string, number>;
};

export type GmailStatus = {
  connected: boolean;
  gmailEmail: string | null;
  lastSyncedAt: string | null;
  createdAt: string | null;
};

export type MessageResult = {
  message: string;
};

export async function connectGmail(): Promise<void> {
  const response = await fetch(getGmailConnectUrl(), {
    headers: getAuthHeaders(),
  });

  const { authorizationUrl } = await handleResponse<{ authorizationUrl: string }>(response);
  window.location.href = authorizationUrl;
}

export async function syncGmail(): Promise<GmailSyncResult> {
  const response = await fetch(`${API_BASE_URL}/api/auth/gmail/sync`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: "{}",
  });

  return handleResponse<GmailSyncResult>(response);
}

export type GmailCountResult = {
  count: number;
};

export async function deleteSuspiciousGmailTransactions(): Promise<GmailCountResult> {
  const response = await fetch(`${API_BASE_URL}/api/auth/gmail/suspicious-transactions`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return handleResponse<GmailCountResult>(response);
}

export async function recategorizeGmailTransactions(): Promise<GmailCountResult> {
  const response = await fetch(`${API_BASE_URL}/api/auth/gmail/recategorize`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: "{}",
  });

  return handleResponse<GmailCountResult>(response);
}

export async function getSuspiciousGmailTransactions(): Promise<Expense[]> {
  const response = await fetch(`${API_BASE_URL}/api/auth/gmail/suspicious-transactions`, {
    headers: getAuthHeaders(),
  });

  return handleResponse<Expense[]>(response);
}

export async function getGmailStatus(): Promise<GmailStatus> {
  const response = await fetch(`${API_BASE_URL}/api/auth/gmail/status`, {
    headers: getAuthHeaders(),
  });

  return handleResponse<GmailStatus>(response);
}

export async function disconnectGmail(): Promise<MessageResult> {
  const response = await fetch(`${API_BASE_URL}/api/auth/gmail/disconnect`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return handleResponse<MessageResult>(response);
}

export async function forgotPassword(email: string): Promise<MessageResult> {
  ensureApiConfigured();
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  return handleResponse<MessageResult>(response);
}

export async function resetPassword(token: string, newPassword: string): Promise<MessageResult> {
  ensureApiConfigured();
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });

  return handleResponse<MessageResult>(response);
}

export type AuthResponse = {
  token: string;
  userId: string;
  name: string;
  email: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

function getAuthToken(): string | null {
  return localStorage.getItem("spendlens_token");
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();

  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

function persistAuthToken(response: AuthResponse): AuthResponse {
  localStorage.setItem("spendlens_token", response.token);
  return response;
}

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

export type UpdateExpensePayload = CreateExpensePayload;

export type MockReceiptImportResult = {
  importedCount: number;
  skippedCount: number;
  createdTransactions: Expense[];
};

export type ParseTextImportPayload = {
  text: string;
};

export type ParseTextImportResult = {
  importedCount: number;
  skippedCount: number;
  createdTransactions: Expense[];
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

function handleSessionExpired() {
  localStorage.removeItem("spendlens_token");
  if (window.location.pathname !== "/" && !window.location.search.includes("auth")) {
    window.location.href = "/?auth=login&session=expired";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  if (response.status === 401 || response.status === 403) {
    handleSessionExpired();
  }

  const message = await getErrorMessage(response);
  throw new ApiError(response.status, message);
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.text();
    if (body) {
      try {
        const json = JSON.parse(body) as { message?: string; error?: string };
        if (json.message) return json.message;
        if (json.error) return json.error;
      } catch {
        if (body.length < 200) return body;
      }
    }
  } catch {
    // ignore
  }

  switch (response.status) {
    case 400:
      return "Revisa los datos enviados e inténtalo de nuevo.";
    case 401:
      return "Correo o contraseña incorrectos.";
    case 403:
      return "Tu sesión expiró. Vuelve a iniciar sesión.";
    case 409:
      return "Ya existe una cuenta con este correo.";
    case 502:
    case 503:
      return "No pudimos conectar con el servidor. Intenta de nuevo.";
    default:
      return response.status >= 500
        ? "No pudimos conectar con el servidor. Intenta de nuevo."
        : "No se pudo completar la solicitud.";
  }
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  ensureApiConfigured();
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await handleResponse<AuthResponse>(response);
  return persistAuthToken(result);
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  ensureApiConfigured();
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await handleResponse<AuthResponse>(response);
  return persistAuthToken(result);
}

function dashboardPeriodQuery(year: number, month: number): string {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  return `?${params.toString()}`;
}

export async function getExpenses(year: number, month: number): Promise<Expense[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/expenses${dashboardPeriodQuery(year, month)}`,
    {
      headers: getAuthHeaders(),
    },
  );

  return handleResponse<Expense[]>(response);
}

export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  const response = await fetch(`${API_BASE_URL}/api/auth/expenses`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<Expense>(response);
}

export async function updateExpense(id: string, payload: UpdateExpensePayload): Promise<Expense> {
  const response = await fetch(`${API_BASE_URL}/api/auth/expenses/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<Expense>(response);
}

export async function getDashboardSummary(year: number, month: number): Promise<DashboardSummary> {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/dashboard/summary${dashboardPeriodQuery(year, month)}`,
    {
      headers: getAuthHeaders(),
    },
  );

  return handleResponse<DashboardSummary>(response);
}

export async function getCategoryBreakdown(
  year: number,
  month: number,
): Promise<CategoryBreakdownItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/dashboard/category-breakdown${dashboardPeriodQuery(year, month)}`,
    {
      headers: getAuthHeaders(),
    },
  );

  return handleResponse<CategoryBreakdownItem[]>(response);
}

export async function getRecentExpenses(year: number, month: number): Promise<Expense[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/auth/dashboard/recent-expenses${dashboardPeriodQuery(year, month)}`,
    {
      headers: getAuthHeaders(),
    },
  );

  return handleResponse<Expense[]>(response);
}

export async function importMockReceipts(): Promise<MockReceiptImportResult> {
  const response = await fetch(`${API_BASE_URL}/api/auth/imports/mock-receipts`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: "{}",
  });

  return handleResponse<MockReceiptImportResult>(response);
}

export async function importReceiptText(
  payload: ParseTextImportPayload
): Promise<ParseTextImportResult> {
  const response = await fetch(`${API_BASE_URL}/api/auth/imports/parse-text`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<ParseTextImportResult>(response);
}
export async function deleteExpense(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/expenses/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleSessionExpired();
    }
    const message = await getErrorMessage(response);
    throw new ApiError(response.status, message);
  }
}

export function logout(): void {
  localStorage.removeItem("spendlens_token");
}