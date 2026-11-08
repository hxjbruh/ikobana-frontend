"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "../components/AdminShell";
import OrderTable from "../components/OrderTable";
import { sidebarBadges } from "../lib/notifications";
import {
  getProducts,
  getTransactions,
  isAdmin,
  requireLogin,
  updateDeliveryStatus,
  updatePaymentStatus,
  type Product,
  type Transaction,
  type User,
} from "../lib/api";

// Pesanan: pesanan masuk yang perlu dikonfirmasi Admin.
// - Terima  : PENDING -> PROCESSING (lanjut ke halaman Pengiriman)
// - Tolak   : PENDING -> CANCELLED  (stok dikembalikan oleh backend)
// - Lunas   : status pembayaran -> COMPLETED
// Customer hanya melihat pesanan miliknya (tanpa tombol aksi).

type Tab = "PENDING" | "PROCESSING" | "ALL";

const TABS: { key: Tab; label: string }[] = [
  { key: "PENDING", label: "Menunggu Konfirmasi" },
  { key: "PROCESSING", label: "Dikemas" },
  { key: "ALL", label: "Semua Pesanan" },
];

export default function OrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tab, setTab] = useState<Tab>("PENDING");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = requireLogin();
    if (!currentUser) return;

    Promise.all([getTransactions(), getProducts()])
      .then(([trx, prods]) => {
        setUser(currentUser);
        setOrders(trx);
        setProducts(prods);
      })
      .catch((err) => setMessage({ type: "error", text: (err as Error).message }))
      .finally(() => setLoading(false));
  }, []);

  const admin = isAdmin(user);

  const counts: Record<Tab, number> = {
    PENDING: orders.filter((o) => o.deliveryStatus === "PENDING").length,
    PROCESSING: orders.filter((o) => o.deliveryStatus === "PROCESSING").length,
    ALL: orders.length,
  };

  const visible = orders
    .filter((o) => tab === "ALL" || o.deliveryStatus === tab)
    .sort((a, b) =>
      tab === "PENDING"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() // yang paling lama menunggu di atas
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  // Jalankan aksi lalu ganti baris dengan data terbaru dari backend.
  async function run(trx: Transaction, action: () => Promise<Transaction>, success: string) {
    setBusyId(trx.id);
    setMessage(null);
    try {
      const updated = await action();
      setOrders((list) => list.map((o) => (o.id === updated.id ? updated : o)));
      setMessage({ type: "success", text: success });
      // Stok berubah kalau pesanan ditolak; muat ulang supaya badge notifikasi ikut benar.
      getProducts().then(setProducts).catch(() => {});
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setBusyId(null);
    }
  }

  const accept = (trx: Transaction) =>
    run(
      trx,
      () => updateDeliveryStatus(trx.id, "PROCESSING"),
      `Pesanan ${trx.transactionId} diterima dan sedang dikemas.`
    );

  const reject = (trx: Transaction) => {
    if (!window.confirm(`Tolak pesanan ${trx.transactionId} dari ${trx.customerName}? Stok produk akan dikembalikan.`)) {
      return;
    }
    run(
      trx,
      () => updateDeliveryStatus(trx.id, "CANCELLED"),
      `Pesanan ${trx.transactionId} ditolak. Stok produk sudah dikembalikan.`
    );
  };

  const markPaid = (trx: Transaction) =>
    run(
      trx,
      () => updatePaymentStatus(trx.id, "COMPLETED"),
      `Pembayaran ${trx.transactionId} ditandai lunas.`
    );

  return (
    <AdminShell user={user} badges={sidebarBadges(user, products, orders)}>
      <div className="dash">
        <div className="dash-head">
          <div>
            <h1>Pesanan</h1>
            <p>
              {admin
                ? "Konfirmasi pesanan masuk sebelum dikemas dan dikirim"
                : "Daftar pesanan Anda beserta statusnya"}
            </p>
          </div>
        </div>

        {message && <div className={`ops-message ${message.type}`}>{message.text}</div>}

        <section className="dash-card">
          <div className="ops-toolbar">
            <div className="dash-tabs ops-tabs" role="tablist" aria-label="Filter pesanan">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  className={tab === t.key ? "active" : ""}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                  <span className="ops-count">{counts[t.key]}</span>
                </button>
              ))}
            </div>

            {admin && counts.PROCESSING > 0 && (
              <Link href="/shipping" className="dash-link small">
                {counts.PROCESSING} pesanan siap dikirim →
              </Link>
            )}
          </div>

          <OrderTable
            orders={visible}
            emptyText={loading ? "Memuat pesanan..." : "Tidak ada pesanan di daftar ini."}
            actions={
              admin
                ? (trx) => {
                    const busy = busyId === trx.id;
                    return (
                      <>
                        {trx.paymentStatus === "PENDING" && trx.deliveryStatus !== "CANCELLED" && (
                          <button type="button" className="ops-btn success" disabled={busy} onClick={() => markPaid(trx)}>
                            Tandai Lunas
                          </button>
                        )}
                        {trx.deliveryStatus === "PENDING" && (
                          <>
                            <button type="button" className="ops-btn primary" disabled={busy} onClick={() => accept(trx)}>
                              Terima
                            </button>
                            <button type="button" className="ops-btn danger" disabled={busy} onClick={() => reject(trx)}>
                              Tolak
                            </button>
                          </>
                        )}
                      </>
                    );
                  }
                : undefined
            }
          />
        </section>
      </div>
    </AdminShell>
  );
}
