"use client";

import { useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import { sidebarBadges } from "../lib/notifications";
import {
  adjustStock,
  CATEGORY_LABELS,
  getProducts,
  getTransactions,
  requireLogin,
  type Product,
  type Transaction,
  type User,
} from "../lib/api";

// Restok Barang (khusus Admin): tambah stok produk yang menipis / habis.
// Stok dikirim ke backend sebagai penambahan (PUT /products/{id}/stock).

type Tab = "LOW" | "ALL";

const MAX_RESTOCK = 10_000;

const isLow = (p: Product) => p.stock <= p.minimumStock;

// Saran restok: isi sampai 2x stok minimum.
const suggestion = (p: Product) => Math.max(p.minimumStock * 2 - p.stock, p.minimumStock);

function validateQty(value: string): string | null {
  if (value.trim() === "") return "Isi jumlah";
  const n = Number(value);
  if (!Number.isInteger(n)) return "Harus bilangan bulat";
  if (n <= 0) return "Minimal 1";
  if (n > MAX_RESTOCK) return `Maksimal ${MAX_RESTOCK.toLocaleString("id-ID")}`;
  return null;
}

export default function RestockPage() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [qty, setQty] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [tab, setTab] = useState<Tab>("LOW");
  const [highlight, setHighlight] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = requireLogin(["ADMIN"]);
    if (!currentUser) return;

    // Dari dashboard/notifikasi: /restock?produk=<id> menyorot produk tersebut.
    const target = Number(new URLSearchParams(window.location.search).get("produk")) || null;

    Promise.all([getProducts(), getTransactions()])
      .then(([prods, trx]) => {
        setUser(currentUser);
        setProducts(prods);
        setTransactions(trx);
        setQty(Object.fromEntries(prods.map((p) => [p.id, String(suggestion(p))])));
        if (target) {
          setHighlight(target);
          const found = prods.find((p) => p.id === target);
          if (found && !isLow(found)) setTab("ALL");
        }
      })
      .catch((err) => setMessage({ type: "error", text: (err as Error).message }))
      .finally(() => setLoading(false));
  }, []);

  // Gulir ke produk yang disorot setelah tabel tampil.
  useEffect(() => {
    if (highlight === null || loading) return;
    document.getElementById(`restock-${highlight}`)?.scrollIntoView({ block: "center" });
    (document.getElementById(`restock-qty-${highlight}`) as HTMLInputElement | null)?.focus();
  }, [highlight, loading]);

  const outCount = products.filter((p) => p.stock === 0).length;
  const lowCount = products.filter((p) => p.stock > 0 && isLow(p)).length;

  const visible = products
    .filter((p) => tab === "ALL" || isLow(p))
    .sort((a, b) => a.stock - a.minimumStock - (b.stock - b.minimumStock));

  async function restock(product: Product) {
    const value = qty[product.id] ?? "";
    const error = validateQty(value);
    setErrors((e) => ({ ...e, [product.id]: error ?? "" }));
    if (error) return;

    setBusyId(product.id);
    setMessage(null);
    try {
      const updated = await adjustStock(product.id, Number(value), "Restok barang");
      setProducts((list) => list.map((p) => (p.id === updated.id ? updated : p)));
      setQty((q) => ({ ...q, [product.id]: String(suggestion(updated)) }));
      setMessage({
        type: "success",
        text: `Stok ${product.name} ditambah ${Number(value).toLocaleString("id-ID")}. Stok sekarang ${updated.stock}.`,
      });
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell user={user} badges={sidebarBadges(user, products, transactions)}>
      <div className="dash">
        <div className="dash-head">
          <div>
            <h1>Restok Barang</h1>
            <p>Tambah stok produk yang menipis atau habis</p>
          </div>
        </div>

        {message && <div className={`ops-message ${message.type}`}>{message.text}</div>}

        <section className="dash-stats">
          <div className="dash-stat">
            <div className="dash-stat-top">
              <div>
                <span className="dash-stat-label">STOK HABIS</span>
                <strong className="dash-stat-value">{outCount}</strong>
              </div>
            </div>
            <div className="dash-stat-foot">
              {outCount > 0 ? <span className="dash-pill danger">Tidak bisa dijual</span> : <span>Semua tersedia</span>}
            </div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-top">
              <div>
                <span className="dash-stat-label">STOK MENIPIS</span>
                <strong className="dash-stat-value">{lowCount}</strong>
              </div>
            </div>
            <div className="dash-stat-foot">
              <span>Di bawah / sama dengan stok minimum</span>
            </div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-top">
              <div>
                <span className="dash-stat-label">TOTAL PRODUK</span>
                <strong className="dash-stat-value">{products.length}</strong>
              </div>
            </div>
            <div className="dash-stat-foot">
              <span>Produk aktif</span>
            </div>
          </div>
        </section>

        <section className="dash-card">
          <div className="ops-toolbar">
            <div className="dash-tabs ops-tabs" role="tablist" aria-label="Filter produk">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "LOW"}
                className={tab === "LOW" ? "active" : ""}
                onClick={() => setTab("LOW")}
              >
                Perlu Restok
                <span className="ops-count">{outCount + lowCount}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "ALL"}
                className={tab === "ALL" ? "active" : ""}
                onClick={() => setTab("ALL")}
              >
                Semua Produk
                <span className="ops-count">{products.length}</span>
              </button>
            </div>
          </div>

          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Kategori</th>
                  <th className="center">Stok</th>
                  <th className="center">Minimum</th>
                  <th className="right">Tambah Stok</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="dash-empty">
                      {loading ? "Memuat produk..." : "Tidak ada produk yang perlu direstok."}
                    </td>
                  </tr>
                )}

                {visible.map((p) => {
                  const error = errors[p.id];
                  return (
                    <tr key={p.id} id={`restock-${p.id}`} className={highlight === p.id ? "ops-highlight" : undefined}>
                      <td>
                        <strong>{p.name}</strong>
                        <small className="ops-sub">SKU: {p.sku}</small>
                      </td>
                      <td className="muted">{CATEGORY_LABELS[p.category]}</td>
                      <td className="center">
                        <span className={`ops-stock ${p.stock === 0 ? "out" : isLow(p) ? "low" : ""}`}>{p.stock}</span>
                        {p.stock === 0 ? (
                          <small className="ops-sub">Habis</small>
                        ) : isLow(p) ? (
                          <small className="ops-sub">Menipis</small>
                        ) : null}
                      </td>
                      <td className="center muted">{p.minimumStock}</td>
                      <td className="right">
                        <form
                          className="ops-qty"
                          noValidate
                          onSubmit={(e) => {
                            e.preventDefault();
                            restock(p);
                          }}
                        >
                          <input
                            id={`restock-qty-${p.id}`}
                            type="number"
                            min={1}
                            max={MAX_RESTOCK}
                            aria-label={`Jumlah restok ${p.name}`}
                            value={qty[p.id] ?? ""}
                            className={error ? "invalid" : undefined}
                            onChange={(e) => {
                              setQty((q) => ({ ...q, [p.id]: e.target.value }));
                              setErrors((er) => ({ ...er, [p.id]: "" }));
                            }}
                          />
                          <button type="submit" className="ops-btn primary" disabled={busyId === p.id}>
                            {busyId === p.id ? "Menyimpan..." : "Tambah"}
                          </button>
                        </form>
                        {error && <span className="ops-field-error">{error}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
