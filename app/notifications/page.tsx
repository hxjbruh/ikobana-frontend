"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "../components/AdminShell";
import { formatDateTime } from "../components/OrderTable";
import {
  buildNotifications,
  getReadIds,
  saveReadIds,
  type AppNotification,
} from "../lib/notifications";
import {
  getProducts,
  getTransactions,
  requireLogin,
  type Transaction,
  type User,
} from "../lib/api";

// Notifikasi: stok habis/menipis & pesanan baru (Admin), atau status pesanan (Customer).

type Filter = "UNREAD" | "ALL";

export default function NotificationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [read, setRead] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("UNREAD");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = requireLogin();
    if (!currentUser) return;

    Promise.all([getProducts(), getTransactions()])
      .then(([prods, trx]) => {
        setUser(currentUser);
        setTransactions(trx);
        setNotifications(buildNotifications(currentUser, prods, trx));
        setRead(getReadIds());
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const unread = notifications.filter((n) => !read.has(n.id));
  const visible = filter === "UNREAD" ? unread : notifications;

  function markRead(ids: string[]) {
    const next = new Set(read);
    ids.forEach((id) => next.add(id));
    // Simpan hanya id yang masih ada supaya localStorage tidak terus membesar.
    const current = new Set(notifications.map((n) => n.id));
    saveReadIds(new Set([...next].filter((id) => current.has(id))));
    setRead(next);
  }

  return (
    <AdminShell
      user={user}
      badges={{
        pesanan: transactions.filter((t) => t.deliveryStatus === "PENDING").length,
        notifikasi: unread.length,
      }}
    >
      <div className="dash">
        <div className="dash-head">
          <div>
            <h1>Notifikasi</h1>
            <p>Hal yang perlu diperhatikan hari ini</p>
          </div>
        </div>

        {error && <div className="ops-message error">{error}</div>}

        <section className="dash-card">
          <div className="ops-toolbar">
            <div className="dash-tabs ops-tabs" role="tablist" aria-label="Filter notifikasi">
              <button
                type="button"
                role="tab"
                aria-selected={filter === "UNREAD"}
                className={filter === "UNREAD" ? "active" : ""}
                onClick={() => setFilter("UNREAD")}
              >
                Belum Dibaca
                <span className="ops-count">{unread.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === "ALL"}
                className={filter === "ALL" ? "active" : ""}
                onClick={() => setFilter("ALL")}
              >
                Semua
                <span className="ops-count">{notifications.length}</span>
              </button>
            </div>

            {unread.length > 0 && (
              <button type="button" className="ops-btn ghost" onClick={() => markRead(unread.map((n) => n.id))}>
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="ops-notif-list">
            {visible.length === 0 && (
              <p className="dash-empty">
                {loading
                  ? "Memuat notifikasi..."
                  : filter === "UNREAD"
                    ? "Tidak ada notifikasi baru."
                    : "Belum ada notifikasi."}
              </p>
            )}

            {visible.map((n) => {
              const isRead = read.has(n.id);
              return (
                <article key={n.id} className={`ops-notif ${n.tone}${isRead ? " read" : ""}`}>
                  <span className="ops-notif-dot" aria-hidden />
                  <div className="ops-notif-body">
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <time dateTime={n.time}>{formatDateTime(n.time)}</time>
                  </div>
                  <div className="ops-actions">
                    <Link href={n.href} className="ops-btn primary" onClick={() => markRead([n.id])}>
                      Lihat
                    </Link>
                    {!isRead && (
                      <button type="button" className="ops-btn ghost" onClick={() => markRead([n.id])}>
                        Tandai dibaca
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
