import { apiFetch } from "./client";

const API_BASE_URL = "/api/v1/auth";

export async function login(loginStr: string, passwordStr: string): Promise<{ requires_password_change?: boolean }> {
  const response = await apiFetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ login: loginStr, password: passwordStr }),
  });

  if (!response.ok) {
    throw new Error("Logowanie nie powiodło się");
  }

  const data = await response.json();
  if (data.message === "Wymagana zmiana hasła") {
    return { requires_password_change: true };
  }
  return { requires_password_change: false };
}

export async function refresh(): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/refresh`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Odświeżanie sesji nie powiodło się");
  }
}

export async function logout(): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/logout`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Wylogowanie nie powiodło się");
  }
}

export async function changePassword(newPassword: string): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ new_password: newPassword }),
  });
  if (!response.ok) {
    throw new Error("Zmiana hasła nie powiodła się");
  }
}
