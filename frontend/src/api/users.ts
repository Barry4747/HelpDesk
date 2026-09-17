import type { User, UserCreateInput, UserUpdateInput } from "../types/user";
import { apiFetch } from "./client";

const API_BASE_URL = "/api/v1/users";

export async function getMe(): Promise<User> {
  const response = await apiFetch(`${API_BASE_URL}/me`);
  if (!response.ok) {
    throw new Error("Pobranie danych użytkownika nie powiodło się");
  }
  return response.json();
}

export async function getUsers(): Promise<User[]> {
  const response = await apiFetch(API_BASE_URL);
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
    if (response.status === 409) {
      throw new Error("Login jest już zajęty");
    }
    throw new Error("Błąd podczas tworzenia użytkownika");
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
    if (response.status === 409) {
      throw new Error("Login jest już zajęty");
    }
    throw new Error("Błąd podczas aktualizacji użytkownika");
  }
  return response.json();
}

export async function deactivateUser(id: string): Promise<User> {
  const response = await apiFetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Błąd podczas dezaktywacji użytkownika");
  return response.json();
}
