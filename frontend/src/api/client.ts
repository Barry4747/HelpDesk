export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const mergedOptions: RequestInit = {
    ...options,
    credentials: "include",
  };

  let response = await fetch(url, mergedOptions);

  if (response.status === 401 && !url.includes("/auth/login") && !url.includes("/auth/refresh") && !url.includes("/auth/change-password")) {
    try {
      const refreshResponse = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!refreshResponse.ok) {
        throw new Error("Refresh failed");
      }

      response = await fetch(url, mergedOptions);
    } catch (err) {
      if (window.location.pathname !== "/login" && window.location.pathname !== "/change-password") {
        window.location.href = "/login";
      }
      throw err;
    }
  }

  return response;
}
