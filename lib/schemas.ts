// Schema validasi BERSAMA untuk klien dan server.
// - Klien (form) memakai schema ini untuk validasi cepat sebelum data dikirim.
// - Server Action memakai schema yang SAMA (safeParse) sehingga data tidak valid
//   tetap ditolak walaupun validasi di browser dilewati (misalnya lewat curl).
// Aturan disesuaikan dengan validasi backend (ProductRequest.java).

import { z } from "zod";

export const PRODUCT_CATEGORIES = [
  "OLAHAN_AYAM",
  "OLAHAN_IKAN",
  "OLAHAN_DAGING",
  "CAMILAN_SIAP_MASAK",
  "LAINNYA",
] as const;

// Input dari form selalu berupa string; string kosong dianggap "belum diisi".
const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const rupiah = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: `${label} wajib diisi` })
      .min(0, `${label} tidak boleh negatif`)
      .max(100_000_000, `${label} terlalu besar`)
  );

export const productSchema = z
  .object({
    name: z
      .string({ error: "Nama produk wajib diisi" })
      .trim()
      .min(3, "Nama produk minimal 3 karakter")
      .max(200, "Nama produk maksimal 200 karakter"),
    category: z.enum(PRODUCT_CATEGORIES, { error: "Pilih kategori produk" }),
    priceRetail: rupiah("Harga jual"),
    priceModal: rupiah("Harga modal"),
    stock: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number({ error: "Stok wajib diisi" })
        .int("Stok harus bilangan bulat")
        .min(0, "Stok tidak boleh negatif")
    ),
    description: z
      .string()
      .trim()
      .max(2000, "Deskripsi maksimal 2000 karakter")
      .optional(),
  })
  .refine((data) => data.priceRetail >= data.priceModal, {
    message: "Harga jual tidak boleh lebih kecil dari harga modal",
    path: ["priceRetail"],
  });

export type ProductFormInput = z.input<typeof productSchema>;
export type ProductFormData = z.output<typeof productSchema>;

// Error per field: { name: ["..."], priceRetail: ["..."] }
export type FieldErrors = Partial<Record<keyof ProductFormData, string[]>>;

export const productIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
