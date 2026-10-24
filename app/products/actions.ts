"use server";

// Server Action untuk CRUD produk.
// Setiap action dibungkus adminAction (next-safe-action):
//   1. belum login / token tidak valid  -> ditolak (serverError)
//   2. bukan Admin                      -> ditolak (serverError)
//   3. input divalidasi productSchema (safeParse) -> error per field (validationErrors)
// Baru setelah lolos semuanya data dikirim ke backend Spring.

import { z } from "zod";
import { returnValidationErrors } from "next-safe-action";
import { adminAction, ActionError } from "@/lib/safe-action";
import { backendFetch, type BackendResult } from "@/lib/server-api";
import { productIdSchema, productSchema } from "@/lib/schemas";
import type { Product } from "../lib/api";

// Error validasi dari backend (jika ada) ditampilkan di field yang sama.
function throwBackendError(res: BackendResult<unknown>): never {
  const fields = Object.keys(productSchema.shape);
  const errors = Object.entries(res.errors ?? {}).filter(([field]) =>
    fields.includes(field)
  );
  if (errors.length > 0) {
    returnValidationErrors(
      productSchema,
      Object.fromEntries(errors.map(([field, message]) => [field, { _errors: [message] }]))
    );
  }
  throw new ActionError(res.message || `Backend menolak permintaan (${res.status}).`);
}

export const createProductAction = adminAction
  .inputSchema(productSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { stock, ...input } = parsedInput;

    const created = await backendFetch<Product>(ctx.token, "POST", "/products", {
      ...input,
      sku: `PR${Date.now().toString().slice(-6)}`,
      minimumStock: 5,
    });
    if (!created.ok || !created.data) throwBackendError(created);

    // Produk baru dibuat dengan stok 0, lalu stok awal ditambahkan.
    if (stock > 0) {
      const adjusted = await backendFetch<Product>(
        ctx.token,
        "PUT",
        `/products/${created.data.id}/stock`,
        { quantity: stock, reason: "Stok awal" }
      );
      if (!adjusted.ok || !adjusted.data) throwBackendError(adjusted);
      return adjusted.data;
    }

    return created.data;
  });

export const updateProductAction = adminAction
  .inputSchema(productSchema)
  .bindArgsSchemas([z.number().int().positive()])
  .action(async ({ parsedInput, bindArgsParsedInputs: [id], ctx }) => {
    const current = await backendFetch<Product>(ctx.token, "GET", `/products/${id}`);
    if (!current.ok || !current.data) throwBackendError(current);

    const { stock, ...input } = parsedInput;
    const updated = await backendFetch<Product>(ctx.token, "PUT", `/products/${id}`, {
      ...input,
      sku: current.data.sku,
      minimumStock: current.data.minimumStock,
      warehouse: current.data.warehouse,
    });
    if (!updated.ok || !updated.data) throwBackendError(updated);

    // Backend menerima perubahan stok sebagai selisih (+/-).
    const delta = stock - current.data.stock;
    if (delta !== 0) {
      const adjusted = await backendFetch<Product>(
        ctx.token,
        "PUT",
        `/products/${id}/stock`,
        { quantity: delta, reason: "Penyesuaian stok (edit produk)" }
      );
      if (!adjusted.ok || !adjusted.data) throwBackendError(adjusted);
      return adjusted.data;
    }

    return updated.data;
  });

export const deleteProductAction = adminAction
  .inputSchema(productIdSchema)
  .action(async ({ parsedInput: { id }, ctx }) => {
    const res = await backendFetch<void>(ctx.token, "DELETE", `/products/${id}`);
    if (!res.ok) throwBackendError(res);
    return { id };
  });
