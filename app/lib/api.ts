// Penghubung frontend ke backend Ikobana (Spring Boot).
// Alamat backend bisa diubah lewat NEXT_PUBLIC_API_URL di file .env.local.

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const TOKEN_KEY = "ikobana_token";
const USER_KEY = "ikobana_user";

// =====================================
// TIPE DATA DARI BACKEND
// =====================================

export type User = {
  id: number;
  email: string;
  username: string;
  fullName: string;
  phone: string;
  role: "ADMIN" | "RETAILER" | "CUSTOMER";
};

export type ProductCategory =
  | "OLAHAN_AYAM"
  | "OLAHAN_IKAN"
  | "OLAHAN_DAGING"
  | "CAMILAN_SIAP_MASAK"
  | "LAINNYA";

export type Product = {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category: ProductCategory;
  priceRetail: number;
  priceModal: number;
  stock: number;
  minimumStock: number;
  warehouse?: string;
  isActive: boolean;
  isLowStock: boolean;
  createdAt: string;
};

export type DeliveryStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export type PaymentMethod = "QRIS" | "TRANSFER_BANK" | "GOPAY" | "SHOPEE_PAY";

export type TransactionItem = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
};

export type Transaction = {
  id: number;
  transactionId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: TransactionItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type Page<T> = { content: T[]; totalElements: number };

// =====================================
// LABEL (enum backend -> teks tampilan)
// =====================================

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  OLAHAN_AYAM: "Olahan Ayam",
  OLAHAN_IKAN: "Olahan Ikan",
  OLAHAN_DAGING: "Olahan Daging",
  CAMILAN_SIAP_MASAK: "Camilan & Siap Masak",
  LAINNYA: "Lainnya",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  QRIS: "QRIS",
  TRANSFER_BANK: "Transfer Bank",
  GOPAY: "GoPay",
  SHOPEE_PAY: "Shopee Pay",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Menunggu",
  COMPLETED: "Lunas",
  FAILED: "Gagal",
  REFUNDED: "Dikembalikan",
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  PENDING: "Menunggu",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  DELIVERED: "Selesai",
  CANCELLED: "Dibatalkan",
};

// Kelompok status yang dipakai di statistik & badge halaman transaksi.
export function statusGroup(
  status: DeliveryStatus
): "Selesai" | "Diproses" | "Menunggu" | "Dibatalkan" {
  if (status === "DELIVERED") return "Selesai";
  if (status === "PROCESSING" || status === "SHIPPED") return "Diproses";
  if (status === "CANCELLED") return "Dibatalkan";
  return "Menunggu";
}

export function formatRupiah(value: number) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

export function formatDate(value: string, withTime = false) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

// =====================================
// SESI LOGIN
// =====================================

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

function saveSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Logout: token dimasukkan ke blacklist di backend (tidak bisa dipakai lagi),
// lalu sesi di browser dihapus. Sesi lokal tetap dihapus walaupun backend tidak bisa dihubungi.
export async function logoutSession() {
  const token = getToken();
  clearSession();
  if (!token) return;
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // abaikan: sesi lokal sudah dihapus
  }
}

export function logout() {
  clearSession();
  window.location.href = "/";
}

export function isAdmin(user: User | null) {
  return user?.role === "ADMIN";
}

// Guard di sisi UI. Dipanggil di awal setiap halaman yang butuh login:
// - belum login             -> diarahkan ke halaman login
// - role tidak diizinkan    -> diarahkan ke halaman 403 (Akses Ditolak)
// Guard ini hanya untuk tampilan; pengamanan sebenarnya tetap di backend (Spring Security).
export function requireLogin(
  allowedRoles?: User["role"][]
): User | null {
  const user = getUser();
  if (!getToken() || !user) {
    window.location.href = "/";
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    window.location.href = "/forbidden";
    return null;
  }
  return user;
}

// =====================================
// REQUEST KE BACKEND
// =====================================

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      "Tidak bisa terhubung ke backend. Pastikan backend sudah dijalankan."
    );
  }

  const json = await res.json().catch(() => null);

  // Token kedaluwarsa / tidak valid / sudah logout: paksa login ulang.
  if (res.status === 401 && token) {
    logout();
  }

  // Role tidak punya izin untuk aksi ini (ditolak backend).
  if (res.status === 403) {
    throw new ApiError(403, "Akses ditolak: Anda tidak memiliki izin untuk aksi ini");
  }

  if (!res.ok || json?.success === false) {
    let message: string = json?.message || `Request gagal (${res.status})`;
    // Gabungkan pesan validasi per field kalau ada.
    if (json?.errors) {
      const details = Object.values(json.errors as Record<string, string>);
      if (details.length > 0) message += `: ${details.join(", ")}`;
    }
    throw new ApiError(res.status, message);
  }

  return json?.data as T;
}

// =====================================
// AUTH
// =====================================

type AuthData = { token: string; user: User };

export async function login(email: string, password: string) {
  // Backend membungkus AuthResponse di dalam ApiResponse: data.data berisi token & user.
  const res = await request<{ data: AuthData }>("POST", "/auth/login", {
    email,
    password,
  });
  saveSession(res.data.token, res.data.user);
  return res.data.user;
}

export async function register(input: {
  fullName: string;
  email: string;
  username: string;
  phone: string;
  password: string;
  confirmPassword: string;
}) {
  const res = await request<{ data: AuthData }>("POST", "/auth/register", input);
  saveSession(res.data.token, res.data.user);
  return res.data.user;
}

// =====================================
// PRODUK
// =====================================

export async function getProducts(): Promise<Product[]> {
  const page = await request<Page<Product>>("GET", "/products?size=1000");
  // Produk yang sudah dihapus (soft delete) tidak ditampilkan.
  return page.content.filter((p) => p.isActive !== false);
}

export function getProduct(id: number | string) {
  return request<Product>("GET", `/products/${id}`);
}

export type ProductInput = {
  sku: string;
  name: string;
  description?: string;
  category: ProductCategory;
  priceRetail: number;
  priceModal: number;
  minimumStock: number;
  warehouse?: string;
};

export function createProduct(input: ProductInput) {
  return request<Product>("POST", "/products", input);
}

export function updateProduct(id: number, input: ProductInput) {
  return request<Product>("PUT", `/products/${id}`, input);
}

export function deleteProduct(id: number) {
  return request<void>("DELETE", `/products/${id}`);
}

// quantity: positif = tambah stok, negatif = kurangi stok.
export function adjustStock(id: number, quantity: number, reason: string) {
  return request<Product>("PUT", `/products/${id}/stock`, { quantity, reason });
}

// =====================================
// TRANSAKSI
// =====================================

export async function getTransactions(): Promise<Transaction[]> {
  const user = getUser();
  // Admin melihat semua transaksi, user biasa hanya transaksinya sendiri.
  const path =
    user?.role === "ADMIN"
      ? "/transactions/admin/all?size=1000"
      : "/transactions?size=1000";
  const page = await request<Page<Transaction>>("GET", path);
  return page.content;
}

export function getTransaction(id: number | string) {
  return request<Transaction>("GET", `/transactions/${id}`);
}

export function updateDeliveryStatus(id: number, deliveryStatus: DeliveryStatus) {
  return request<Transaction>("PUT", `/transactions/${id}/delivery-status`, {
    deliveryStatus,
  });
}

export function updatePaymentStatus(id: number, paymentStatus: PaymentStatus) {
  return request<Transaction>("PUT", `/transactions/${id}/payment-status`, {
    paymentStatus,
  });
}
