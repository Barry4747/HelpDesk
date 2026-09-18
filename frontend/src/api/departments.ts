import type { Department, DepartmentUpdateInput } from "../types/department";
import { apiFetch } from "./client";

const API_BASE_URL = "/api/v1/departments";

export async function getDepartments(): Promise<Department[]> {
  const response = await apiFetch(API_BASE_URL);
  if (!response.ok) throw new Error("Błąd pobierania działów");
  return response.json();
}

export async function createDepartment(name: string): Promise<Department> {
  const response = await apiFetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("Dział o tej nazwie już istnieje");
    }
    throw new Error("Błąd tworzenia działu");
  }
  return response.json();
}

export async function updateDepartment(id: string, data: DepartmentUpdateInput): Promise<Department> {
  const response = await apiFetch(`${API_BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("Dział o tej nazwie już istnieje");
    }
    throw new Error("Błąd edycji działu");
  }
  return response.json();
}
