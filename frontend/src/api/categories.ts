import type { Category, CategoryUpdateInput } from "../types/category";
import { apiFetch } from "./client";

const API_BASE_URL = "/api/v1/categories";

export async function getCategories(): Promise<Category[]> {
  const response = await apiFetch(API_BASE_URL);
  if (!response.ok) throw new Error("Błąd pobierania kategorii");
  return response.json();
}

export async function createCategory(name: string): Promise<Category> {
  const response = await apiFetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("Kategoria o tej nazwie już istnieje");
    }
    throw new Error("Błąd tworzenia kategorii");
  }
  return response.json();
}

export async function updateCategory(id: string, data: CategoryUpdateInput): Promise<Category> {
  const response = await apiFetch(`${API_BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("Kategoria o tej nazwie już istnieje");
    }
    throw new Error("Błąd edycji kategorii");
  }
  return response.json();
}
