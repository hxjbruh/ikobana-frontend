// Wrapper next-safe-action: semua mutasi (tambah/ubah/hapus) WAJIB lewat client ini,
// sehingga autentikasi dicek di setiap action tanpa perlu ditulis ulang.
import "server-only";

import { cookies } from "next/headers";
import { createSafeActionClient } from "next-safe-action";
import { backendFetch, TOKEN_COOKIE, type BackendUser } from "./server-api";

// Error yang pesannya boleh ditampilkan ke pengguna.
export class ActionError extends Error {}

export const actionClient = createSafeActionClient({
  defaultValidationErrorsShape: "flattened",
  handleServerError(error) {
    if (error instanceof ActionError) return error.message;
    console.error("Server Action gagal:", error);
    return "Terjadi kesalahan pada server. Coba lagi.";
  },
});

// Pengguna harus login: token diambil dari cookie lalu diverifikasi ke backend
// (GET /auth/me), jadi token palsu / kedaluwarsa / sudah logout ikut ditolak.
export const authAction = actionClient.use(async ({ next }) => {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) {
    throw new ActionError("Anda harus login terlebih dahulu.");
  }

  const res = await backendFetch<BackendUser>(token, "GET", "/auth/me");
  if (!res.ok || !res.data) {
    throw new ActionError("Sesi tidak valid atau sudah berakhir. Silakan login ulang.");
  }

  return next({ ctx: { token, user: res.data } });
});

// Khusus Admin (kelola produk).
export const adminAction = authAction.use(async ({ next, ctx }) => {
  if (ctx.user.role !== "ADMIN") {
    throw new ActionError("Akses ditolak: hanya Admin yang boleh mengelola produk.");
  }
  return next();
});
