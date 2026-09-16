export type AuthSession = { token: string; user: { id: string; firstName: string; lastName: string; email: string }; permissions: string[]; isDemo?: boolean };

export const demoSession: AuthSession = {
  token: "demo-session",
  user: { id: "demo-user", firstName: "Admin", lastName: "User", email: "admin@securitask.demo" },
  permissions: ["users.view", "users.create", "users.update", "users.deactivate", "roles.view", "roles.create", "roles.update", "roles.delete", "roles.assign_permissions", "audit.view", "clients.view", "clients.create", "clients.update", "clients.archive", "employees.view", "employees.create", "employees.update", "employees.archive", "accounts.view", "accounts.create", "accounts.update", "expense_categories.view", "expense_categories.create", "expense_categories.update", "invoices.view", "invoices.create", "invoices.update", "invoices.issue", "payments.view", "payments.create", "expenses.view", "expenses.create", "expenses.update", "expenses.approve", "payroll.view", "payroll.create", "payroll.update", "payroll.approve", "payroll.mark_paid", "advances.view", "advances.create", "advances.update", "advances.recover", "reports.view", "reports.export"],
  isDemo: true,
};

const storageKey = "securitask.auth-session";

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(storageKey);
  if (!value) return null;
  try { return JSON.parse(value) as AuthSession; } catch { sessionStorage.removeItem(storageKey); return null; }
}

export function saveSession(session: AuthSession) { sessionStorage.setItem(storageKey, JSON.stringify(session)); }
export function clearSession() { sessionStorage.removeItem(storageKey); }

export async function apiRequest<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers } });
  const body = await response.json().catch(() => null) as { error?: string; details?: { fieldErrors?: Record<string, string[] | undefined> } } | T | null;
  if (!response.ok) {
    const errorBody = body && typeof body === "object" && "error" in body ? body : null;
    const fieldMessage = errorBody?.details?.fieldErrors ? Object.values(errorBody.details.fieldErrors).flat().find(Boolean) : undefined;
    throw new Error(fieldMessage ? `${errorBody?.error ?? "Request failed."} ${fieldMessage}` : errorBody?.error ?? "Request failed.");
  }
  return body as T;
}
