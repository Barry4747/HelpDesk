import type { User } from "../types/user";
import { apiFetch } from "./client";

const API_BASE_URL = "/api/v1/users";

export async function getMe(): Promise<User> {
  const response = await apiFetch(`${API_BASE_URL}/me`);
  if (!response.ok) {
    throw new Error("Pobranie danych użytkownika nie powiodło się");
  }
  return response.json();
}
