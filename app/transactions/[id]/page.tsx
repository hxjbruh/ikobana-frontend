"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DELIVERY_STATUS_LABELS,
  formatDate,
  getTransaction,
  isAdmin,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  requireLogin,
  statusGroup,
  updateDeliveryStatus,
  type DeliveryStatus,
} from "../../lib/api";

type Product = {
  name: string;
  quantity: number;
  price: number;
  total: number;
  icon: string;
};

type Transaction = {
  dbId: number;
  id: string;
  customer: string;
  email: string;
  phone: string;
  date: string;
  status: DeliveryStatus;
  address: string;
  district: string;
  city: string;
  postalCode: string;
  products: Product[];
  shipping: number;
  payment: string;
  paymentStatus: string;
  paymentTime: string;
};

export default function TransactionDetail() {
  const params = useParams();

  const transactionId = String(params.id);

  const [transaction, setTransaction] =
    useState<Transaction | null>(null);

  const [status, setStatus] =
    useState<DeliveryStatus>("PENDING");

  const [loading, setLoading] =
    useState(true);

  // Hanya Admin yang boleh mengubah status transaksi.
  const [canManage, setCanManage] =
    useState(false);

  // =====================================================
  // AMBIL DATA TRANSAKSI (dari backend)
  // =====================================================

  useEffect(() => {
    const user = requireLogin();
    if (!user) return;

    getTransaction(transactionId)
      .then((trx) => {
        setCanManage(isAdmin(user));

        /*
         * Backend belum menyimpan alamat pengiriman & ongkir,
         * jadi kolom alamat diisi dari catatan transaksi.
         */
        const mapped: Transaction = {
          dbId: trx.id,
          id: trx.transactionId.replace(/^#/, ""),
          customer: trx.customerName,
          email: trx.customerEmail || "-",
          phone: trx.customerPhone || "-",
          date: formatDate(trx.createdAt, true),
          status: trx.deliveryStatus,
          address: trx.notes || "Alamat belum tersedia",
          district: "",
          city: "",
          postalCode: "",
          products: (trx.items || []).map((item) => ({
            name: item.productName,
            quantity: item.quantity,
            price: Number(item.pricePerUnit),
            total: Number(item.subtotal),
            icon: "📦",
          })),
          shipping: 0,
          payment: PAYMENT_METHOD_LABELS[trx.paymentMethod] || "-",
          paymentStatus: PAYMENT_STATUS_LABELS[trx.paymentStatus] || "-",
          paymentTime:
            trx.paymentStatus === "COMPLETED"
              ? formatDate(trx.updatedAt, true)
              : "-",
        };

        setTransaction(mapped);
        setStatus(mapped.status);
      })
      .catch((error) => {
        console.error(
          "Gagal mengambil data transaksi:",
          error
        );
      })
      .finally(() => setLoading(false));
  }, [transactionId]);

  // =====================================================
  // UPDATE STATUS
  // =====================================================

  const handleUpdateStatus = async () => {
    if (!transaction) return;

    try {
      await updateDeliveryStatus(transaction.dbId, status);

      setTransaction({
        ...transaction,
        status: status,
      });

      alert(
        "Status transaksi berhasil diperbarui!"
      );
    } catch (error) {
      console.error(
        "Gagal memperbarui status:",
        error
      );

      alert(
        `Gagal memperbarui status transaksi: ${(error as Error).message}`
      );
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h2>IKOBANA</h2>
            <p>Frozen Food</p>
          </div>
        </aside>

        <main className="main-content">
          <h1>Memuat Detail Transaksi...</h1>
        </main>
      </div>
    );
  }

  // =====================================================
  // TRANSAKSI TIDAK DITEMUKAN
  // =====================================================

  if (!transaction) {
    return (
      <div className="dashboard-layout">

        <aside className="sidebar">

          <div className="sidebar-logo">
            <h2>IKOBANA</h2>
            <p>Frozen Food</p>
          </div>

          <nav className="sidebar-menu">

            <Link href="/dashboard">
              🏠 Dashboard
            </Link>

            <Link href="/products">
              📦 Produk
            </Link>

            <Link
              href="/transactions"
              className="active"
            >
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

        <main className="main-content">

          <h1>
            Transaksi Tidak Ditemukan
          </h1>

          <p>
            Data transaksi dengan ID{" "}
            <strong>
              {transactionId}
            </strong>{" "}
            tidak tersedia.
          </p>

          <br />

          <Link
            href="/transactions"
            className="back-transaction"
          >
            ← Kembali ke Transaksi
          </Link>

        </main>

      </div>
    );
  }

  // =====================================================
  // HITUNG SUBTOTAL
  // =====================================================

  /*
   * Menggunakan ?? [] supaya tidak error
   * apabila products tidak tersedia.
   */

  const subtotal =
    (transaction.products ?? []).reduce(
      (total, product) =>
        total + product.total,
      0
    );

  const grandTotal =
    subtotal + (transaction.shipping || 0);

  // =====================================================
  // TAMPILAN
  // =====================================================

  return (
    <div className="dashboard-layout">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        <div className="sidebar-logo">

          <h2>
            IKOBANA
          </h2>

          <p>
            Frozen Food
          </p>

        </div>

        <nav className="sidebar-menu">

          <Link href="/dashboard">
            🏠 Dashboard
          </Link>

          <Link href="/products">
            📦 Produk
          </Link>

          <Link
            href="/transactions"
            className="active"
          >
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

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="main-content">

        {/* HEADER */}

        <header className="dashboard-header">

          <div>

            <h1>
              Detail Transaksi
            </h1>

            <p>
              Informasi lengkap transaksi pelanggan
            </p>

          </div>

          <div className="admin-profile">

            <div className="admin-avatar">
              A
            </div>

            <div>

              <strong>
                Admin
              </strong>

              <small>
                Administrator
              </small>

            </div>

          </div>

        </header>

        {/* =================================================
            BACK
        ================================================= */}

        <Link
          href="/transactions"
          className="back-transaction"
        >
          ← Kembali ke Transaksi
        </Link>

        {/* =================================================
            TRANSACTION HEADER
        ================================================= */}

        <section className="transaction-detail-card">

          <div className="transaction-detail-header">

            <div>

              <h2>
                #{transaction.id}
              </h2>

              <p>
                {transaction.date}
              </p>

            </div>

            <span
              className={`transaction-status ${
                statusGroup(transaction.status) === "Selesai"
                  ? "status-success"
                  : statusGroup(transaction.status) === "Diproses"
                  ? "status-process"
                  : "status-waiting"
              }`}
            >
              {DELIVERY_STATUS_LABELS[transaction.status]}
            </span>

          </div>

        </section>

        {/* =================================================
            CUSTOMER + ADDRESS
        ================================================= */}

        <section className="transaction-detail-grid">

          {/* INFORMASI PELANGGAN */}

          <div className="transaction-detail-card">

            <h3>
              Informasi Pelanggan
            </h3>

            <div className="detail-info">

              <div>

                <span>
                  Nama Pelanggan
                </span>

                <strong>
                  {transaction.customer}
                </strong>

              </div>

              <div>

                <span>
                  Email
                </span>

                <strong>
                  {transaction.email}
                </strong>

              </div>

              <div>

                <span>
                  No. Telepon
                </span>

                <strong>
                  {transaction.phone}
                </strong>

              </div>

            </div>

          </div>

          {/* ALAMAT PENGIRIMAN */}

          <div className="transaction-detail-card">

            <h3>
              Alamat Pengiriman
            </h3>

            <div className="detail-address">

              <strong>
                {transaction.customer}
              </strong>

              <p>

                {[
                  transaction.address,
                  transaction.district,
                  transaction.city,
                  transaction.postalCode,
                ]
                  .filter(Boolean)
                  .map((line, index) => (
                    <span key={index}>
                      {index > 0 && <br />}
                      {line}
                    </span>
                  ))}

              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            UPDATE STATUS
        ================================================= */}

        {canManage && (
        <section className="transaction-detail-card">

          <h3>
            Update Status Transaksi
          </h3>

          <div className="status-update">

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as DeliveryStatus)
              }
            >

              {Object.entries(DELIVERY_STATUS_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}

            </select>

            <button
              onClick={
                handleUpdateStatus
              }
            >
              Update Status
            </button>

          </div>

        </section>
        )}

        {/* =================================================
            PRODUCTS
        ================================================= */}

        <section className="transaction-detail-card">

          <h3>
            Produk yang Dibeli
          </h3>

          {(transaction.products ?? []).length === 0 ? (

            <p>
              Tidak ada data produk.
            </p>

          ) : (

            (transaction.products ?? []).map(
              (product, index) => (

                <div
                  className="transaction-product"
                  key={index}
                >

                  <div className="product-detail-info">

                    <div className="product-image">
                      {product.icon}
                    </div>

                    <div>

                      <strong>
                        {product.name}
                      </strong>

                      <p>
                        {product.quantity} × Rp
                        {product.price.toLocaleString(
                          "id-ID"
                        )}
                      </p>

                    </div>

                  </div>

                  <strong>
                    Rp
                    {product.total.toLocaleString(
                      "id-ID"
                    )}
                  </strong>

                </div>

              )
            )

          )}

        </section>

        {/* =================================================
            PAYMENT SUMMARY
        ================================================= */}

        <section className="transaction-detail-card">

          <h3>
            Ringkasan Pembayaran
          </h3>

          <div className="payment-summary">

            <div>

              <span>
                Subtotal
              </span>

              <strong>
                Rp
                {subtotal.toLocaleString(
                  "id-ID"
                )}
              </strong>

            </div>

            <div>

              <span>
                Ongkos Kirim
              </span>

              <strong>
                Rp
                {(transaction.shipping || 0).toLocaleString(
                  "id-ID"
                )}
              </strong>

            </div>

            <div className="payment-total">

              <span>
                Total Pembayaran
              </span>

              <strong>
                Rp
                {grandTotal.toLocaleString(
                  "id-ID"
                )}
              </strong>

            </div>

          </div>

        </section>

        {/* =================================================
            PAYMENT INFORMATION
        ================================================= */}

        <section className="transaction-detail-card">

          <h3>
            Informasi Pembayaran
          </h3>

          <div className="detail-info">

            <div>

              <span>
                Metode Pembayaran
              </span>

              <strong>
                {transaction.payment}
              </strong>

            </div>

            <div>

              <span>
                Status Pembayaran
              </span>

              <strong className="payment-success">
                {transaction.paymentStatus}
              </strong>

            </div>

            <div>

              <span>
                Waktu Pembayaran
              </span>

              <strong>
                {transaction.paymentTime}
              </strong>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}