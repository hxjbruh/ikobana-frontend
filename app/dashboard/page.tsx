"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AdminShell, { initials } from "../components/AdminShell";
import {
  formatRupiah,
  getProducts,
  getTransactions,
  requireLogin,
  type DeliveryStatus,
  type Product,
  type Transaction,
  type User,
} from "../lib/api";

// Dashboard mengikuti desain Figma "dasboard" (web hight fidelity).
// Semua angka dihitung dari data produk & transaksi di backend.

type Period = "day" | "week" | "month";

const PERIOD_LABELS: Record<Period, string> = {
  day: "Hari ini",
  week: "Minggu ini",
  month: "Bulan ini",
};

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const DAY_NAMES_FULL = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

// Transaksi yang dibatalkan tidak dihitung sebagai penjualan.
const isSale = (trx: Transaction) => trx.deliveryStatus !== "CANCELLED";

const isLowStock = (p: Product) => p.isLowStock || p.stock <= p.minimumStock;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Minggu dimulai hari Senin.
function startOfWeek(date: Date) {
  const day = (date.getDay() + 6) % 7;
  const start = startOfDay(date);
  start.setDate(start.getDate() - day);
  return start;
}

function sameMonth(date: Date, ref: Date) {
  return date.getFullYear() === ref.getFullYear() && date.getMonth() === ref.getMonth();
}

// Rp 5.800.000 -> "Rp 5.8jt"
function shortRupiah(value: number) {
  if (value >= 1_000_000) return `Rp ${Number((value / 1_000_000).toFixed(1))}jt`;
  if (value >= 1_000) return `Rp ${Number((value / 1_000).toFixed(1))}rb`;
  return `Rp ${value}`;
}

// Persentase perubahan dibanding bulan lalu; null kalau bulan lalu kosong.
function growth(current: number, previous: number) {
  if (previous <= 0) return null;
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

type Bar = { label: string; fullLabel: string; total: number };

function buildBars(sales: Transaction[], period: Period, now: Date): { bars: Bar[]; days: number } {
  if (period === "day") {
    // 6 blok @4 jam
    const start = startOfDay(now).getTime();
    const bars = [0, 4, 8, 12, 16, 20].map((h) => ({
      label: `${String(h).padStart(2, "0")}.00`,
      fullLabel: `Pukul ${String(h).padStart(2, "0")}.00`,
      total: 0,
    }));
    for (const trx of sales) {
      const t = new Date(trx.createdAt).getTime();
      if (t < start || t >= start + 86_400_000) continue;
      bars[Math.floor(new Date(trx.createdAt).getHours() / 4)].total += Number(trx.totalAmount);
    }
    return { bars, days: 1 };
  }

  if (period === "week") {
    const start = startOfWeek(now).getTime();
    const bars = DAY_NAMES.map((label, i) => ({ label, fullLabel: DAY_NAMES_FULL[i], total: 0 }));
    for (const trx of sales) {
      const t = new Date(trx.createdAt).getTime();
      if (t < start || t >= start + 7 * 86_400_000) continue;
      bars[Math.floor((t - start) / 86_400_000)].total += Number(trx.totalAmount);
    }
    return { bars, days: ((now.getDay() + 6) % 7) + 1 };
  }

  // Bulan ini: per minggu (tgl 1-7, 8-14, ...)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const bars = Array.from({ length: Math.ceil(daysInMonth / 7) }, (_, i) => ({
    label: `Mg ${i + 1}`,
    fullLabel: `Minggu ke-${i + 1}`,
    total: 0,
  }));
  for (const trx of sales) {
    const d = new Date(trx.createdAt);
    if (!sameMonth(d, now)) continue;
    bars[Math.floor((d.getDate() - 1) / 7)].total += Number(trx.totalAmount);
  }
  return { bars, days: now.getDate() };
}

// Batas atas sumbu Y yang "bulat" (kelipatan 1,5 / 3 / 6 ...).
function niceMax(value: number) {
  if (value <= 0) return 6_000_000;
  const step = Math.pow(10, Math.floor(Math.log10(value)));
  for (const m of [1.2, 1.5, 3, 6, 12]) {
    if (m * step >= value) return m * step;
  }
  return 12 * step;
}

const STATUS_BADGE: Record<DeliveryStatus, { label: string; tone: string }> = {
  DELIVERED: { label: "Berhasil", tone: "success" },
  SHIPPED: { label: "Diproses", tone: "process" },
  PROCESSING: { label: "Diproses", tone: "process" },
  PENDING: { label: "Menunggu", tone: "pending" },
  CANCELLED: { label: "Dibatalkan", tone: "danger" },
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<Period>("week");
  const [error, setError] = useState("");
  const [now] = useState(() => new Date());

  useEffect(() => {
    const currentUser = requireLogin();
    if (!currentUser) return;

    getProducts()
      .then((data) => {
        setUser(currentUser);
        setProducts(data);
      })
      .catch((err) => setError((err as Error).message));

    getTransactions()
      .then(setTransactions)
      .catch((err) => setError((err as Error).message));
  }, []);

  // ===== Statistik =====
  const lowStock = products
    .filter(isLowStock)
    .sort((a, b) => a.stock - b.stock);

  const newProducts = products.filter((p) => sameMonth(new Date(p.createdAt), now)).length;

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonthTrx = transactions.filter((t) => sameMonth(new Date(t.createdAt), now));
  const lastMonthTrx = transactions.filter((t) => sameMonth(new Date(t.createdAt), lastMonth));

  const revenue = (list: Transaction[]) =>
    list.filter(isSale).reduce((sum, t) => sum + Number(t.totalAmount), 0);

  const revenueThisMonth = revenue(thisMonthTrx);
  const trxGrowth = growth(thisMonthTrx.length, lastMonthTrx.length);
  const revenueGrowth = growth(revenueThisMonth, revenue(lastMonthTrx));

  const pendingOrders = transactions.filter(
    (t) => t.deliveryStatus === "PENDING" || t.deliveryStatus === "PROCESSING"
  ).length;

  // ===== Grafik =====
  const { bars, days } = buildBars(transactions.filter(isSale), period, now);
  const periodTotal = bars.reduce((sum, b) => sum + b.total, 0);
  const peak = bars.reduce((best, b) => (b.total > best.total ? b : best), bars[0]);
  const yMax = niceMax(peak.total);
  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((f) => f * yMax);

  // ===== Transaksi terbaru =====
  const recent = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const todayLabel = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <AdminShell user={user} badges={{ pesanan: pendingOrders, notifikasi: lowStock.length }}>
      <div className="dash">
        {/* JUDUL */}
        <div className="dash-head">
          <div>
            <h1>Dashboard</h1>
            <p>Ringkasan aktivitas dan performa Ikobana Frozen Food</p>
          </div>
          <span className="dash-date">
            <Image src="/figma/icon-calendar.svg" alt="" unoptimized width={13.5} height={15} />
            Hari ini: {todayLabel}
          </span>
        </div>

        {error && <p className="dash-error">{error}</p>}

        {/* PERINGATAN STOK */}
        {lowStock.length > 0 && (
          <div className="dash-alert" role="status">
            <span className="dash-alert-icon">
              <Image src="/figma/icon-alert-banner.svg" alt="" unoptimized width={18.333} height={15.833} />
            </span>
            <p>
              Perhatian: Ada <strong>{lowStock.length} produk</strong> dengan stok menipis dan
              perlu restock segera.
            </p>
          </div>
        )}

        {/* KARTU STATISTIK */}
        <section className="dash-stats">
          <div className="dash-stat">
            <div className="dash-stat-top">
              <div>
                <span className="dash-stat-label">TOTAL PRODUK</span>
                <strong className="dash-stat-value">{products.length.toLocaleString("id-ID")}</strong>
              </div>
              <span className="dash-stat-icon blue">
                <Image src="/figma/stat-produk.svg" alt="" unoptimized width={20} height={20} />
              </span>
            </div>
            <div className="dash-stat-foot">
              <span>Produk aktif</span>
              {newProducts > 0 && <b>+{newProducts} produk baru</b>}
            </div>
          </div>

          <div className="dash-stat">
            <div className="dash-stat-top">
              <div>
                <span className="dash-stat-label">STOK MENIPIS</span>
                <strong className="dash-stat-value">{lowStock.length}</strong>
              </div>
              <span className="dash-stat-icon red">
                <Image src="/figma/stat-stok-menipis.svg" alt="" unoptimized width={22} height={19} />
              </span>
            </div>
            <div className="dash-stat-foot">
              {lowStock.length > 0 ? (
                <span className="dash-pill danger">Perhatian Segera</span>
              ) : (
                <span>Semua stok aman</span>
              )}
            </div>
          </div>

          <div className="dash-stat">
            <div className="dash-stat-top">
              <div>
                <span className="dash-stat-label">TOTAL TRANSAKSI</span>
                <strong className="dash-stat-value">
                  {thisMonthTrx.length.toLocaleString("id-ID")}
                </strong>
              </div>
              <span className="dash-stat-icon sky">
                <Image src="/figma/stat-transaksi.svg" alt="" unoptimized width={18} height={20} />
              </span>
            </div>
            <div className="dash-stat-foot">
              <span>Bulan ini</span>
              {trxGrowth && <Trend value={trxGrowth} />}
            </div>
          </div>

          <div className="dash-stat">
            <div className="dash-stat-top">
              <div>
                <span className="dash-stat-label">TOTAL PENDAPATAN</span>
                <strong className="dash-stat-value money">
                  {formatRupiah(revenueThisMonth).replace(" ", "")}
                </strong>
              </div>
              <span className="dash-stat-icon pale">
                <Image src="/figma/stat-pendapatan.svg" alt="" unoptimized width={22} height={16} />
              </span>
            </div>
            <div className="dash-stat-foot">
              <span>Bulan ini</span>
              {revenueGrowth && <Trend value={revenueGrowth} />}
            </div>
          </div>
        </section>

        <section className="dash-grid">
          {/* GRAFIK PENJUALAN */}
          <div className="dash-card dash-chart-card">
            <div className="dash-card-head">
              <div>
                <h2>Ringkasan Penjualan</h2>
                <p>Performa penjualan Ikobana</p>
              </div>
              <div className="dash-tabs" role="tablist" aria-label="Periode penjualan">
                {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="tab"
                    aria-selected={period === p}
                    className={period === p ? "active" : ""}
                    onClick={() => setPeriod(p)}
                  >
                    {PERIOD_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="dash-chart">
              <div className="dash-chart-grid" aria-hidden>
                {yTicks.map((tick) => (
                  <div key={tick} className="dash-chart-line">
                    <span>{tick === 0 ? "Rp 0" : shortRupiah(tick)}</span>
                    <i />
                  </div>
                ))}
              </div>
              <div className="dash-chart-bars">
                {bars.map((bar) => (
                  <div
                    key={bar.label}
                    className="dash-bar"
                    title={`${bar.fullLabel}: ${formatRupiah(bar.total)}`}
                  >
                    <div className="dash-bar-track">
                      <div
                        className={
                          bar === peak && bar.total > 0 ? "dash-bar-fill peak" : "dash-bar-fill"
                        }
                        style={{ height: `${(bar.total / yMax) * 100}%` }}
                      />
                    </div>
                    <span className={bar === peak && bar.total > 0 ? "peak" : ""}>{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dash-chart-foot">
              <div>
                <i className="dot empty" />
                <span>Rata-rata Harian:</span>
                <strong>{formatRupiah(Math.round(periodTotal / days))}</strong>
              </div>
              <div>
                <i className="dot" />
                <span>Puncak Penjualan:</span>
                <strong className="blue">
                  {peak.total > 0 ? `${peak.fullLabel} (${shortRupiah(peak.total)})` : "-"}
                </strong>
              </div>
            </div>
          </div>

          {/* PRODUK STOK MENIPIS */}
          <div className="dash-card dash-low">
            <div className="dash-card-head">
              <div>
                <h2>Produk Stok Menipis</h2>
                <p>Segera lakukan restock sebelum kehabisan</p>
              </div>
              {lowStock.length > 0 && <span className="dash-pill danger">{lowStock.length} Item</span>}
            </div>

            <div className="dash-low-list">
              {lowStock.length === 0 && <p className="dash-empty">Tidak ada produk dengan stok menipis.</p>}

              {lowStock.slice(0, 4).map((product) => (
                <div key={product.id} className="dash-low-item">
                  <div>
                    <strong>{product.name}</strong>
                    <div className="dash-low-meta">
                      <span>
                        Sisa: <b>{product.stock}</b> / Min: {product.minimumStock}
                      </span>
                      {product.stock === 0 ? (
                        <span className="dash-tag solid">Habis</span>
                      ) : (
                        <span className="dash-tag">Stok Menipis</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/products/edit/${product.id}`} className="dash-low-btn">
                    Update Stok
                  </Link>
                </div>
              ))}

              {lowStock.length > 4 && (
                <Link href="/products" className="dash-link small">
                  Lihat {lowStock.length - 4} produk lainnya
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* TRANSAKSI TERBARU */}
        <section className="dash-card dash-recent">
          <div className="dash-card-head">
            <div>
              <h2>Transaksi Terbaru</h2>
              <p>Daftar 5 pesanan masuk terakhir</p>
            </div>
            <Link href="/transactions" className="dash-link">
              Lihat Semua Transaksi
              <Image src="/figma/icon-arrow-right.svg" alt="" unoptimized width={12} height={12} />
            </Link>
          </div>

          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>ID<br />Transaksi</th>
                  <th>Pelanggan</th>
                  <th>Produk</th>
                  <th>Tanggal &amp;<br />Waktu</th>
                  <th className="right">Total</th>
                  <th className="center">Status</th>
                  <th className="right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={7} className="dash-empty">Belum ada transaksi.</td>
                  </tr>
                )}

                {recent.map((trx) => {
                  const status = STATUS_BADGE[trx.deliveryStatus];
                  const date = new Date(trx.createdAt);
                  return (
                    <tr key={trx.id}>
                      <td className="dash-trx-id">{trx.transactionId}</td>
                      <td>
                        <span className="dash-customer">
                          <span className="dash-initials">{initials(trx.customerName)}</span>
                          {trx.customerName}
                        </span>
                      </td>
                      <td className="muted">
                        {trx.items.map((item) => `${item.productName} (${item.quantity}×)`).join(", ")}
                      </td>
                      <td className="muted">
                        {date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })},
                        <br />
                        {date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="right dash-total">{formatRupiah(trx.totalAmount)}</td>
                      <td className="center">
                        <span className={`dash-status ${status.tone}`}>
                          <i />
                          {status.label}
                        </span>
                      </td>
                      <td className="right">
                        <Link href={`/transactions/${trx.id}`} className="dash-detail-btn">
                          Detail
                        </Link>
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

function Trend({ value }: { value: string }) {
  const down = value.startsWith("-");
  return (
    <b className={down ? "dash-trend down" : "dash-trend"}>
      <Image src="/figma/icon-trend-up.svg" alt="" unoptimized width={11.667} height={7} />
      {value}
    </b>
  );
}
