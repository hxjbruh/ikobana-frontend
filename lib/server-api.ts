// Pemanggilan backend Spring dari sisi server (dipakai Server Action).
import "server-only";

export const TOKEN_COOKIE = "ikobana_token";

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080/api";

export type BackendUser = {
  id: number;
  email: string;
  fullName: string;
  role: "ADMIN" | "RETAILER" | "CUSTOMER";
};

export type BackendResult<T> = {
  ok: boolean;
  status: number;
  data?: T;
  message?: string;
  // Error validasi per field dari backend (Bean Validation)
  errors?: Record<string, string>;
};

export async function backendFetch<T>(
  token: string,
  method: string,
  path: string,
  body?: unknown
): Promise<BackendResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined && { "Content-Type": "application/json" }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 0, message: "Tidak bisa terhubung ke backend." };
  }

  const json = await res.json().catch(() => null);
  return {
    ok: res.ok && json?.success !== false,
    status: res.status,
    data: json?.data,
    message: json?.message,
    errors: json?.errors,
  };
}
