"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  formatDate,
  getProducts,
  getTransactions,
  requireLogin,
  statusGroup,
  type User,
} from "../lib/api";

type Product = {
  name: string;
  stock: number;
  sku: string;
};

type Transaction = {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: string;
};

export default function DashboardPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [user, setUser] = useState<User | null>(null);

  // =====================================
  // LOAD DATA PRODUK & TRANSAKSI (dari backend)
  // =====================================

  useEffect(() => {
    const currentUser = requireLogin();
    if (!currentUser) return;

    getProducts()
      .then((data) => {
        setUser(currentUser);
        setProducts(
          data.map((product) => ({
            name: product.name,
            stock: product.stock,
            sku: product.sku,
          }))
        );
      })
      .catch((err) => console.error("Gagal memuat produk:", err));

    getTransactions()
      .then((data) =>
        setTransactions(
          data.map((trx) => ({
            id: trx.transactionId.replace(/^#/, ""),
            customer: trx.customerName,
            date: formatDate(trx.createdAt),
            total: Number(trx.totalAmount),
            status: statusGroup(trx.deliveryStatus),
          }))
        )
      )
      .catch((err) => console.error("Gagal memuat transaksi:", err));
  }, []);

  // =====================================
  // DATA DASHBOARD
  // =====================================

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (total, product) =>
      total + product.stock,
    0
  );

  const lowStockProducts = products.filter(
    (product) =>
      product.stock > 0 &&
      product.stock <= 5
  );

  const totalOrders = transactions.length;

  const uniqueCustomers = new Set(
    transactions.map(
      (transaction) =>
        transaction.customer
    )
  ).size;

  const totalRevenue = transactions.reduce(
    (total, transaction) =>
      total + transaction.total,
    0
  );

  const formatRupiah = (value: number) => {
    return `Rp ${value.toLocaleString("id-ID")}`;
  };

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">
            ❄
          </div>

          <div>
            <h2>Ikobana</h2>
            <span>Frozenfood</span>
          </div>

        </div>

        <nav className="menu">

          <Link
            className="menu-item active"
            href="/dashboard"
          >
            <span>▣</span>
            Dashboard
          </Link>

          <Link
            className="menu-item"
            href="/products"
          >
            <span>▤</span>
            Produk & Stok
          </Link>

          <Link
            className="menu-item"
            href="/transactions"
          >
            <span>▥</span>
            Transaksi
          </Link>

          <Link
            className="menu-item"
            href="/settings"
          >
            <span>⚙</span>
            Pengaturan
          </Link>

        </nav>

        <div className="sidebar-bottom">

          <div className="admin-profile">

            <div className="avatar">
              A
            </div>

            <div>
              <strong>{user?.fullName || "Admin"}</strong>
              <small>{user?.role === "ADMIN" ? "Administrator" : "Pengguna"}</small>
            </div>

          </div>

          <Link
            href="/"
            className="logout"
          >
            ↪ Keluar
          </Link>

        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-content">

        {/* HEADER */}
        <header className="dashboard-header">

          <div>

            <h1>
              Dashboard
            </h1>

            <p>
              Selamat datang kembali, {user?.fullName || "Admin"}!
            </p>

          </div>

          <div className="header-right">

            <button className="notification">
              🔔
            </button>

            <div className="header-user">

              <div className="avatar">
                A
              </div>

              <div>
                <strong>{user?.fullName || "Admin"}</strong>
                <small>{user?.role === "ADMIN" ? "Administrator" : "Pengguna"}</small>
              </div>

            </div>

          </div>

        </header>

        {/* STATISTICS */}
        <section className="statistics">

          {/* TOTAL PRODUK */}
          <div className="stat-card">

            <div className="stat-icon blue">
              📦
            </div>

            <div>

              <p>
                Total Produk
              </p>

              <h2>
                {totalProducts}
              </h2>

              <span className="positive">
                {totalStock} total stok
              </span>

            </div>

          </div>

          {/* TOTAL PESANAN */}
          <div className="stat-card">

            <div className="stat-icon green">
              🛒
            </div>

            <div>

              <p>
                Total Pesanan
              </p>

              <h2>
                {totalOrders}
              </h2>

              <span className="positive">
                Data transaksi
              </span>

            </div>

          </div>

          {/* TOTAL PELANGGAN */}
          <div className="stat-card">

            <div className="stat-icon orange">
              👥
            </div>

            <div>

              <p>
                Total Pelanggan
              </p>

              <h2>
                {uniqueCustomers}
              </h2>

              <span className="positive">
                Pelanggan unik
              </span>

            </div>

          </div>

          {/* TOTAL PENDAPATAN */}
          <div className="stat-card">

            <div className="stat-icon purple">
              💰
            </div>

            <div>

              <p>
                Total Pendapatan
              </p>

              <h2>
                {formatRupiah(totalRevenue)}
              </h2>

              <span className="positive">
                Dari transaksi
              </span>

            </div>

          </div>

        </section>

        {/* CONTENT GRID */}
        <section className="dashboard-grid">

          {/* PENJUALAN */}
          <div className="dashboard-card chart-card">

            <div className="card-header">

              <div>

                <h3>
                  Penjualan
                </h3>

                <p>
                  Statistik penjualan 7 hari terakhir
                </p>

              </div>

              <select>

                <option>
                  7 Hari
                </option>

                <option>
                  30 Hari
                </option>

              </select>

            </div>

            <div className="chart">

              <div
                className="chart-bar"
                style={{ height: "40%" }}
              />

              <div
                className="chart-bar"
                style={{ height: "60%" }}
              />

              <div
                className="chart-bar"
                style={{ height: "45%" }}
              />

              <div
                className="chart-bar"
                style={{ height: "75%" }}
              />

              <div
                className="chart-bar"
                style={{ height: "55%" }}
              />

              <div
                className="chart-bar"
                style={{ height: "90%" }}
              />

              <div
                className="chart-bar"
                style={{ height: "70%" }}
              />

            </div>

            <div className="chart-labels">

              <span>Sen</span>
              <span>Sel</span>
              <span>Rab</span>
              <span>Kam</span>
              <span>Jum</span>
              <span>Sab</span>
              <span>Min</span>

            </div>

          </div>

          {/* STOK MENIPIS */}
          <div className="dashboard-card">

            <div className="card-header">

              <div>

                <h3>
                  Stok Menipis
                </h3>

                <p>
                  Produk yang perlu diperhatikan
                </p>

              </div>

              <Link href="/products">
                Lihat semua
              </Link>

            </div>

            <div className="stock-list">

              {lowStockProducts.length > 0 ? (

                lowStockProducts.map(
                  (product) => (

                    <div
                      className="stock-item"
                      key={product.sku}
                    >

                      <div>

                        <strong>
                          {product.name}
                        </strong>

                        <small>
                          SKU: {product.sku}
                        </small>

                      </div>

                      <span
                        className={
                          product.stock <= 3
                            ? "stock-danger"
                            : "stock-warning"
                        }
                      >
                        {product.stock} tersisa
                      </span>

                    </div>

                  )
                )

              ) : (

                <p>
                  Tidak ada produk dengan stok menipis.
                </p>

              )}

            </div>

          </div>

        </section>

        {/* TRANSACTIONS */}
        <section className="dashboard-card transaction-card">

          <div className="card-header">

            <div>

              <h3>
                Transaksi Terbaru
              </h3>

              <p>
                Daftar transaksi terbaru
              </p>

            </div>

            <Link href="/transactions">
              Lihat semua
            </Link>

          </div>

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>
                    ID Transaksi
                  </th>

                  <th>
                    Pelanggan
                  </th>

                  <th>
                    Tanggal
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {transactions.map(
                  (transaction) => (

                    <tr
                      key={transaction.id}
                    >

                      <td>
                        #{transaction.id}
                      </td>

                      <td>
                        {transaction.customer}
                      </td>

                      <td>
                        {transaction.date}
                      </td>

                      <td>
                        {formatRupiah(
                          transaction.total
                        )}
                      </td>

                      <td>

                        <span
                          className={
                            transaction.status ===
                            "Selesai"
                              ? "status success"
                              : transaction.status ===
                                "Diproses"
                              ? "status process"
                              : "status pending"
                          }
                        >
                          {transaction.status}
                        </span>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </section>

      </main>

    </div>
  );
}