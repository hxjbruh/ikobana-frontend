"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { requireLogin } from "../../lib/api";
import { createProductAction } from "../actions";
import {
  emptyFormState,
  formValues,
  ProductFields,
  resultToState,
  validateOnClient,
  asActionInput,
  type ProductFormState,
} from "../product-form";

export default function AddProductPage() {
  const router = useRouter();

  useEffect(() => {
    requireLogin(["ADMIN"]);
  }, []);

  // Form -> validasi klien (schema bersama) -> Server Action (safeParse di server).
  // Hasilnya (error per field / sukses) ditampilkan lewat useActionState.
  const [state, formAction, saving] = useActionState(
    async (_prev: ProductFormState, formData: FormData): Promise<ProductFormState> => {
      const values = formValues(formData);

      const clientErrors = validateOnClient(values);
      if (clientErrors) return { values, fieldErrors: clientErrors };

      const result = await createProductAction(asActionInput(values));
      if (result.data) {
        router.push("/products");
        return { values: {}, fieldErrors: {}, success: true };
      }
      return resultToState(values, result);
    },
    emptyFormState
  );

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="sidebar-logo">
          <h2>IKOBANA</h2>
          <p>Frozen Food</p>
        </div>

        <nav className="sidebar-menu">

          <Link href="/dashboard">
            🏠 Dashboard
          </Link>

          <Link
            href="/products"
            className="active"
          >
            📦 Produk
          </Link>

          <Link href="/transactions">
            🧾 Transaksi
          </Link>

          <Link href="/settings">
            ⚙️ Pengaturan
          </Link>

        </nav>

        <div className="sidebar-bottom">

          <Link href="/">
            🚪 Keluar
          </Link>

        </div>

      </aside>

      {/* MAIN */}
      <main className="main-content">

        <header className="dashboard-header">

          <div>
            <h1>
              Tambah Produk
            </h1>

            <p>
              Tambahkan produk baru ke dalam katalog
            </p>
          </div>

          <div className="admin-profile">

            <div className="admin-avatar">
              A
            </div>

            <div>
              <strong>Admin</strong>
              <small>Administrator</small>
            </div>

          </div>

        </header>

        {/* BACK */}
        <Link
          href="/products"
          className="back-transaction"
        >
          ← Kembali ke Produk
        </Link>

        {/* FORM */}
        <section className="transaction-detail-card">

          <form
            action={formAction}
            noValidate
            className="product-form"
          >

            <ProductFields state={state} />

            <div className="form-actions">

              <Link
                href="/products"
                className="cancel-button"
              >
                Batal
              </Link>

              <button
                type="submit"
                className="save-product-button"
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan Produk"}
              </button>

            </div>

          </form>

        </section>

      </main>

    </div>
  );
}