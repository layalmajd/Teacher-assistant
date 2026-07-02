import { useAuthStore } from "@/app/store/use-auth-store";
import { usePreferenceStore } from "@/app/store/use-preference-store";
import { createApiRequestError } from "@/lib/error-messages";
import type { AuthResponse } from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

type RequestOptions = RequestInit & {
  bodyJson?: unknown;
};

let refreshPromise: Promise<string | null> | null = null;

function shouldTryRefresh(path: string) {
  return !["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"].includes(path);
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { refreshToken, setSession, clearSession } = useAuthStore.getState();
      if (!refreshToken) {
        clearSession();
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        clearSession();
        return null;
      }

      const payload = (await response.json()) as AuthResponse;
      setSession({
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        instructor: payload.instructor,
      });
      return payload.access_token;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

function buildRequest(path: string, options: RequestOptions, accessToken: string | null) {
  const { language } = usePreferenceStore.getState();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Accept-Language", language === "ar" ? "ar" : "en");
  if (options.bodyJson !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.bodyJson !== undefined ? JSON.stringify(options.bodyJson) : options.body,
  });
}

async function parseErrorResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | {
        error?: { code?: string; message?: string; details?: Record<string, unknown> };
        detail?: Array<{ msg?: string }> | { msg?: string } | string;
      }
    | null;
  const detailMessage = Array.isArray(payload?.detail)
    ? payload?.detail.map((item) => item.msg).filter(Boolean).join(", ")
    : typeof payload?.detail === "string"
      ? payload.detail
      : payload?.detail && typeof payload.detail === "object" && "msg" in payload.detail
        ? payload.detail.msg
        : undefined;

  return createApiRequestError({
    code: payload?.error?.code,
    status: response.status,
    rawMessage: payload?.error?.message ?? detailMessage ?? "Request failed",
    details: payload?.error?.details,
  });
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await buildRequest(path, options, useAuthStore.getState().accessToken);
  } catch (error) {
    throw createApiRequestError({
      code: "network_error",
      rawMessage: error instanceof Error ? error.message : "Failed to fetch",
    });
  }

  if (response.status === 401) {
    const refreshedAccessToken = shouldTryRefresh(path) ? await refreshSession() : null;
    if (refreshedAccessToken) {
      try {
        response = await buildRequest(path, options, refreshedAccessToken);
      } catch (error) {
        throw createApiRequestError({
          code: "network_error",
          rawMessage: error instanceof Error ? error.message : "Failed to fetch",
        });
      }
    }
  }

  if (response.status === 401) {
    useAuthStore.getState().clearSession();
    throw createApiRequestError({
      code: "authentication_error",
      status: response.status,
      rawMessage: "Unauthorized",
    });
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
