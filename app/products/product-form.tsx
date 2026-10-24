"use client";

// Bagian form produk yang dipakai bersama oleh halaman tambah, edit,
// dan form "Tambah Cepat" di daftar produk.
import "./product-form.css";
import { CATEGORY_LABELS } from "../lib/api";
import { z } from "zod";
import { productSchema, type FieldErrors, type ProductFormInput } from "@/lib/schemas";

export type ProductFormValues = Record<string, string>;

export type ProductFormState = {
  values: ProductFormValues;
  fieldErrors: FieldErrors;
  formError?: string;
  success?: boolean;
};

export const emptyFormState: ProductFormState = { values: {}, fieldErrors: {} };

export function formValues(formData: FormData): ProductFormValues {
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value)])
  );
}

// Validasi di klien memakai schema yang SAMA dengan server (lib/schemas.ts).
// Hanya untuk respon cepat; keputusan akhir tetap di Server Action.
export function validateOnClient(values: ProductFormValues): FieldErrors | null {
  const result = productSchema.safeParse(values);
  return result.success ? null : z.flattenError(result.error).fieldErrors;
}

// Mengubah hasil next-safe-action menjadi state form.
export function resultToState(
  values: ProductFormValues,
  result: {
    serverError?: string;
    validationErrors?: { formErrors: string[]; fieldErrors: FieldErrors };
  }
): ProductFormState {
  return {
    values,
    fieldErrors: result.validationErrors?.fieldErrors ?? {},
    formError: result.serverError ?? result.validationErrors?.formErrors[0],
  };
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="field-error">{messages[0]}</p>;
}

export function ProductFields({
  state,
  showDescription = true,
}: {
  state: ProductFormState;
  showDescription?: boolean;
}) {
  const { values, fieldErrors } = state;
  const invalid = (field: keyof FieldErrors) =>
    fieldErrors[field]?.length ? "input-invalid" : undefined;

  return (
    <>
      {state.formError && <div className="form-error">{state.formError}</div>}

      <div className="form-group">
        <label htmlFor="name">Nama Produk</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Masukkan nama produk"
          defaultValue={values.name}
          className={invalid("name")}
        />
        <FieldError messages={fieldErrors.name} />
      </div>

      <div className="form-group">
        <label htmlFor="category">Kategori</label>
        {/* key: supaya pilihan kembali ke nilai terakhir setelah form di-reset */}
        <select
          id="category"
          name="category"
          key={values.category ?? ""}
          defaultValue={values.category ?? ""}
          className={invalid("category")}
        >
          <option value="">Pilih kategori</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <FieldError messages={fieldErrors.category} />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="priceRetail">Harga Jual</label>
          <input
            id="priceRetail"
            name="priceRetail"
            type="number"
            placeholder="Contoh: 30000"
            defaultValue={values.priceRetail}
            className={invalid("priceRetail")}
          />
          <FieldError messages={fieldErrors.priceRetail} />
        </div>

        <div className="form-group">
          <label htmlFor="priceModal">Harga Modal</label>
          <input
            id="priceModal"
            name="priceModal"
            type="number"
            placeholder="Contoh: 22000"
            defaultValue={values.priceModal}
            className={invalid("priceModal")}
          />
          <FieldError messages={fieldErrors.priceModal} />
        </div>

        <div className="form-group">
          <label htmlFor="stock">Stok</label>
          <input
            id="stock"
            name="stock"
            type="number"
            placeholder="Contoh: 20"
            defaultValue={values.stock}
            className={invalid("stock")}
          />
          <FieldError messages={fieldErrors.stock} />
        </div>
      </div>

      {showDescription && (
        <div className="form-group">
          <label htmlFor="description">Deskripsi</label>
          <textarea
            id="description"
            name="description"
            placeholder="Masukkan deskripsi produk"
            defaultValue={values.description}
            rows={5}
            className={invalid("description")}
          />
          <FieldError messages={fieldErrors.description} />
        </div>
      )}
    </>
  );
}

// Nilai form dikirim apa adanya (string); Server Action yang mem-parse & memvalidasi.
export function asActionInput(values: ProductFormValues) {
  return values as unknown as ProductFormInput;
}
