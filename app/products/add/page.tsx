"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adjustStock,
  CATEGORY_LABELS,
  createProduct,
  requireLogin,
  type ProductCategory,
} from "../../lib/api";

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [priceModal, setPriceModal] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    requireLogin(["ADMIN"]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const product = await createProduct({
        sku: `PR${Date.now().toString().slice(-6)}`,
        name,
        category: category as ProductCategory,
        priceRetail: Number(price),
        priceModal: Number(priceModal),
        minimumStock: 5,
        description,
      });

      // Produk baru dibuat dengan stok 0, lalu stok awal ditambahkan.
      if (Number(stock) > 0) {
        await adjustStock(product.id, Number(stock), "Stok awal");
      }

      alert("Produk berhasil ditambahkan!");

      router.push("/products");
    } catch (err) {
      alert(`Gagal menambahkan produk: ${(err as Error).message}`);
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