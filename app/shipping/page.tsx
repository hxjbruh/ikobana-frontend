"use client";

import { useEffect, useState } from "react";
import AdminShell from "../components/AdminShell";
import OrderTable from "../components/OrderTable";
import { sidebarBadges } from "../lib/notifications";
import {
  getProducts,
  getTransactions,
  requireLogin,
  updateDeliveryStatus,
  type DeliveryStatus,
  type Product,
  type Transaction,
  type User,
} from "../lib/api";

// Pengiriman (khusus Admin): pesanan yang sudah diterima Admin.
// Dikemas (PROCESSING) -> Kirim -> Dikirim (SHIPPED) -> Selesai -> Diterima (DELIVERED)

type Tab = "PROCESSING" | "SHIPPED" | "DELIVERED";

const TABS: { key: Tab; label: string }[] = [
  { key: "PROCESSING", label: "Siap Dikirim" },
  { key: "SHIPPED", label: "Dalam Pengiriman" },
  { key: "DELIVERED", label: "Selesai" },
];

export default function ShippingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tab, setTab] = useState<Tab>("PROCESSING");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = requireLogin(["ADMIN"]);
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

  const count = (status: Tab) => orders.filter((o) => o.deliveryStatus === status).length;

  const visible = orders
    .filter((o) => o.deliveryStatus === tab)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  async function move(trx: Transaction, next: DeliveryStatus, success: string) {
    setBusyId(trx.id);
    setMessage(null);
    try {
      const updated = await updateDeliveryStatus(trx.id, next);
      setOrders((list) => list.map((o) => (o.id === updated.id ? updated : o)));
      setMessage({ type: "success", text: success });
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setBusyId(null);
    }
  }

  const ship = (trx: Transaction) => {
    // Pesanan COD/transfer yang belum dibayar tetap boleh dikirim, tapi Admin diingatkan.
    if (
      trx.paymentStatus !== "COMPLETED" &&
      !window.confirm(`Pembayaran ${trx.transactionId} belum lunas. Tetap kirim pesanan?`)
    ) {
      return;
    }
    move(trx, "SHIPPED", `Pesanan ${trx.transactionId} sedang dikirim ke ${trx.customerName}.`);
  };

  const finish = (trx: Transaction) =>
    move(trx, "DELIVERED", `Pesanan ${trx.transactionId} sudah diterima pelanggan.`);

  return (
    <AdminShell user={user} badges={sidebarBadges(user, products, orders)}>
      <div className="dash">
        <div className="dash-head">
          <div>
            <h1>Pengiriman</h1>
            <p>Kirim pesanan yang sudah dikemas dan pantau sampai diterima pelanggan</p>
          </div>
        </div>

        {message && <div className={`ops-message ${message.type}`}>{message.text}</div>}

        <section className="dash-card">
          <div className="ops-toolbar">
            <div className="dash-tabs ops-tabs" role="tablist" aria-label="Status pengiriman">
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
                  <span className="ops-count">{count(t.key)}</span>
                </button>
              ))}
            </div>
          </div>

          <OrderTable
            orders={visible}
            emptyText={loading ? "Memuat data pengiriman..." : "Tidak ada pesanan di tahap ini."}
            actions={(trx) => {
              const busy = busyId === trx.id;
              if (trx.deliveryStatus === "PROCESSING") {
                return (
                  <button type="button" className="ops-btn primary" disabled={busy} onClick={() => ship(trx)}>
                    Kirim
                  </button>
                );
              }
              if (trx.deliveryStatus === "SHIPPED") {
                return (
                  <button type="button" className="ops-btn success" disabled={busy} onClick={() => finish(trx)}>
                    Tandai Diterima
                  </button>
                );
              }
              return null;
            }}
          />
        </section>
      </div>
    </AdminShell>
  );
}
