"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  adjustStock,
  CATEGORY_LABELS,
  getProduct,
  requireLogin,
  updateProduct,
  type Product,
  type ProductCategory,
} from "../../../lib/api";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [priceModal, setPriceModal] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!requireLogin(["ADMIN"])) return;

    getProduct(id)
      .then((data) => {
        setProduct(data);
        setName(data.name);
        setCategory(data.category);
        setPrice(String(data.priceRetail));
        setPriceModal(String(data.priceModal));
        setStock(String(data.stock));
        setDescription(data.description || "");
      })
      .catch((err) => {
        alert(`Gagal memuat produk: ${err.message}`);
        router.push("/products");
      });
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSaving(true);

    try {
      await updateProduct(product.id, {
        sku: product.sku,
        name,
        category: category as ProductCategory,
        priceRetail: Number(price),
        priceModal: Number(priceModal),
        minimumStock: product.minimumStock,
        warehouse: product.warehouse,
        description,
      });

      // Stok diubah lewat endpoint terpisah, dikirim selisihnya saja.
      const stockChange = Number(stock) - product.stock;
      if (stockChange !== 0) {
        await adjustStock(product.id, stockChange, "Penyesuaian stok manual");
      }

      alert("Produk berhasil diperbarui!");

      router.push("/products");
    } catch (err) {
      alert(`Gagal memperbarui produk: ${(err as Error).message}`);
      setSaving(false);
    }
  };

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

          <form
            onSubmit={handleSubmit}
            className="product-form"
          >

            <div className="form-group">

              <label>
                Nama Produk
              </label>

              <input
                type="text"
                placeholder="Masukkan nama produk"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
              />

            </div>

            <div className="form-group">

              <label>
                Kategori
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                required
              >

                <option value="">
                  Pilih kategori
                </option>

                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}

              </select>

            </div>

            <div className="form-row">

              <div className="form-group">

                <label>
                  Harga Jual
                </label>

                <input
                  type="number"
                  min={0}
                  placeholder="Contoh: 30000"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value)
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Harga Modal
                </label>

                <input
                  type="number"
                  min={0}
                  placeholder="Contoh: 22000"
                  value={priceModal}
                  onChange={(e) =>
                    setPriceModal(e.target.value)
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Stok
                </label>

                <input
                  type="number"
                  min={0}
                  placeholder="Contoh: 20"
                  value={stock}
                  onChange={(e) =>
                    setStock(e.target.value)
                  }
                  required
                />

              </div>

            </div>

            <div className="form-group">

              <label>
                Deskripsi
              </label>

              <textarea
                placeholder="Masukkan deskripsi produk"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows={5}
              />

            </div>

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
                disabled={saving || !product}
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>

            </div>

          </form>

        </section>

      </main>

    </div>
  );
}