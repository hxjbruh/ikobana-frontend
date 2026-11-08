"use client";

import Link from "next/link";
import { initials } from "./AdminShell";
import {
  formatRupiah,
  PAYMENT_METHOD_LABELS,
  type DeliveryStatus,
  type PaymentStatus,
  type Transaction,
} from "../lib/api";

// Tabel pesanan yang dipakai halaman Pesanan & Pengiriman.
// Tombol aksi tiap baris diisi oleh halaman lewat prop `actions`.

export const DELIVERY_BADGE: Record<DeliveryStatus, { label: string; tone: string }> = {
  PENDING: { label: "Menunggu Konfirmasi", tone: "pending" },
  PROCESSING: { label: "Dikemas", tone: "process" },
  SHIPPED: { label: "Dikirim", tone: "process" },
  DELIVERED: { label: "Diterima", tone: "success" },
  CANCELLED: { label: "Dibatalkan", tone: "danger" },
};

const PAYMENT_BADGE: Record<PaymentStatus, { label: string; tone: string }> = {
  PENDING: { label: "Belum Bayar", tone: "pending" },
  COMPLETED: { label: "Lunas", tone: "success" },
  FAILED: { label: "Gagal", tone: "danger" },
  REFUNDED: { label: "Refund", tone: "danger" },
};

export function formatDateTime(value: string) {
  const date = new Date(value);
  return `${date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}, ${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
}

type OrderTableProps = {
  orders: Transaction[];
  emptyText: string;
  actions?: (trx: Transaction) => React.ReactNode;
};

export default function OrderTable({ orders, emptyText, actions }: OrderTableProps) {
  return (
    <div className="dash-table-wrap">
      <table className="dash-table">
        <thead>
          <tr>
            <th>ID Transaksi</th>
            <th>Pelanggan</th>
            <th>Produk</th>
            <th>Tanggal</th>
            <th className="right">Total</th>
            <th className="center">Pembayaran</th>
            <th className="center">Status</th>
            <th className="right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr>
              <td colSpan={8} className="dash-empty">{emptyText}</td>
            </tr>
          )}

          {orders.map((trx) => {
            const delivery = DELIVERY_BADGE[trx.deliveryStatus];
            const payment = PAYMENT_BADGE[trx.paymentStatus];
            return (
              <tr key={trx.id}>
                <td className="dash-trx-id">{trx.transactionId}</td>
                <td>
                  <span className="dash-customer">
                    <span className="dash-initials">{initials(trx.customerName)}</span>
                    <span>
                      {trx.customerName}
                      <small className="ops-sub">{trx.customerPhone}</small>
                    </span>
                  </span>
                </td>
                <td className="muted">
                  {trx.items.map((item) => `${item.productName} (${item.quantity}×)`).join(", ")}
                </td>
                <td className="muted">{formatDateTime(trx.createdAt)}</td>
                <td className="right dash-total">{formatRupiah(trx.totalAmount)}</td>
                <td className="center">
                  <span className={`dash-status ${payment.tone}`}>
                    <i />
                    {payment.label}
                  </span>
                  <small className="ops-sub">{PAYMENT_METHOD_LABELS[trx.paymentMethod]}</small>
                </td>
                <td className="center">
                  <span className={`dash-status ${delivery.tone}`}>
                    <i />
                    {delivery.label}
                  </span>
                </td>
                <td className="right">
                  <div className="ops-actions">
                    {actions?.(trx)}
                    <Link href={`/transactions/${trx.id}`} className="dash-detail-btn">
                      Detail
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
