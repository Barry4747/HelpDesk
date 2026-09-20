import type { User, UserCreateInput, UserUpdateInput, UserFilterParams, PaginatedUsersResponse } from "../types/user";
import { apiFetch } from "./client";

const API_BASE_URL = "/api/v1/users";

export async function getMe(): Promise<User> {
  const response = await apiFetch(`${API_BASE_URL}/me`);
  if (!response.ok) throw new Error("Błąd autoryzacji");
  return response.json();
}

export async function getUsers(filters?: UserFilterParams): Promise<PaginatedUsersResponse> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  const queryString = params.toString();
  const url = queryString ? `${API_BASE_URL}?${queryString}` : API_BASE_URL;
  const response = await apiFetch(url);
  if (!response.ok) throw new Error("Błąd podczas pobierania użytkowników");
  return response.json();
}

export async function getUser(id: string): Promise<User> {
  const response = await apiFetch(`${API_BASE_URL}/${id}`);
  if (!response.ok) throw new Error("Błąd podczas pobierania użytkownika");
  return response.json();
}

export async function createUser(data: UserCreateInput): Promise<User> {
  const response = await apiFetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Błąd podczas tworzenia użytkownika");
  }
  return response.json();
}

export async function updateUser(id: string, data: UserUpdateInput): Promise<User> {
  const response = await apiFetch(`${API_BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Błąd podczas aktualizacji użytkownika");
  }
  return response.json();
}

export async function deactivateUser(id: string): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Błąd podczas dezaktywacji użytkownika");
  }
}
