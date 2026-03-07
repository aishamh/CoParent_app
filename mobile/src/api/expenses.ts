import { fetchApi } from "./client";
import type { Expense } from "../types/schema";

export async function getExpenses(
  childId?: number,
  status?: string,
): Promise<Expense[]> {
  try {
    const params = new URLSearchParams();
    if (childId) params.set("childId", String(childId));
    if (status) params.set("status", status);

    const query = params.toString();
    const path = query ? `/api/expenses?${query}` : "/api/expenses";
    return await fetchApi<Expense[]>(path);
  } catch {
    return [];
  }
}

export async function createExpense(
  expense: Omit<Expense, "id">,
): Promise<Expense | null> {
  try {
    return await fetchApi<Expense>("/api/expenses", {
      method: "POST",
      body: JSON.stringify(expense),
    });
  } catch {
    return null;
  }
}

export async function updateExpense(
  id: number,
  expense: Partial<Expense>,
): Promise<Expense | null> {
  try {
    return await fetchApi<Expense>(`/api/expenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(expense),
    });
  } catch {
    return null;
  }
}

export async function deleteExpense(id: number): Promise<boolean> {
  try {
    await fetchApi<void>(`/api/expenses/${id}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}
