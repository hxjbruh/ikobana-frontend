"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { getProduct, requireLogin, type Product } from "../../../lib/api";
import { updateProductAction } from "../../actions";
import {
  formValues,
  ProductFields,
  resultToState,
  validateOnClient,
  asActionInput,
  type ProductFormState,
} from "../../product-form";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!requireLogin(["ADMIN"])) return;

    getProduct(id)
      .then(setProduct)
      .catch((err) => {
        alert(`Gagal memuat produk: ${err.message}`);
        router.push("/products");
      });
  }, [id, router]);

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
              Edit Produk
            </h1>

            <p>
              Ubah informasi produk dan stok
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

          {product ? (
            <EditProductForm product={product} />
          ) : (
            <p>Memuat data produk...</p>
          )}

        </section>

      </main>

    </div>
  );
}
// Form edit dibuat setelah data produk termuat, supaya nilai awal form terisi.
function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();

  const initialState: ProductFormState = {
    values: {
      name: product.name,
      category: product.category,
      priceRetail: String(product.priceRetail),
      priceModal: String(product.priceModal),
      stock: String(product.stock),
      description: product.description || "",
    },
    fieldErrors: {},
  };

  // id produk "diikat" ke action (bindArgsSchemas di server ikut memvalidasinya).
  const updateThisProduct = updateProductAction.bind(null, product.id);

  const [state, formAction, saving] = useActionState(
    async (_prev: ProductFormState, formData: FormData): Promise<ProductFormState> => {
      const values = formValues(formData);

      const clientErrors = validateOnClient(values);
      if (clientErrors) return { values, fieldErrors: clientErrors };

      const result = await updateThisProduct(asActionInput(values));
      if (result.data) {
        router.push("/products");
        return { values, fieldErrors: {}, success: true };
      }
      return resultToState(values, result);
    },
    initialState
  );

  return (
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
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>

      </div>

    </form>
  );
}
