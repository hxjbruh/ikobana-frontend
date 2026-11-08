// Notifikasi dibentuk dari data produk & transaksi di backend (tidak ada tabel notifikasi
// terpisah). Status "sudah dibaca" disimpan per browser di localStorage.

import type { Product, Transaction, User } from "./api";

export type NotificationTone = "danger" | "warning" | "info" | "success";

export type AppNotification = {
  // id ikut berubah kalau datanya berubah (mis. stok berubah), jadi muncul lagi sebagai belum dibaca
  id: string;
  title: string;
  message: string;
  time: string;
  href: string;
  tone: NotificationTone;
};

const READ_KEY = "ikobana_notif_read";

const productTime = (p: Product) => p.updatedAt || p.createdAt;

export function buildNotifications(
  user: User | null,
  products: Product[],
  transactions: Transaction[]
): AppNotification[] {
  const list: AppNotification[] = [];

  if (user?.role === "ADMIN") {
    for (const p of products) {
      if (p.stock === 0) {
        list.push({
          id: `stock-out-${p.id}-${p.stock}`,
          title: "Stok habis",
          message: `${p.name} sudah habis. Segera lakukan restok.`,
          time: productTime(p),
          href: `/restock?produk=${p.id}`,
          tone: "danger",
        });
      } else if (p.isLowStock || p.stock <= p.minimumStock) {
        list.push({
          id: `stock-low-${p.id}-${p.stock}`,
          title: "Stok menipis",
          message: `${p.name} tersisa ${p.stock} (minimum ${p.minimumStock}).`,
          time: productTime(p),
          href: `/restock?produk=${p.id}`,
          tone: "warning",
        });
      }
    }

    for (const trx of transactions) {
      if (trx.deliveryStatus === "PENDING") {
        list.push({
          id: `order-new-${trx.id}`,
          title: "Pesanan baru",
          message: `${trx.customerName} memesan ${trx.items.length} produk (${trx.transactionId}). Menunggu konfirmasi.`,
          time: trx.createdAt,
          href: "/orders",
          tone: "info",
        });
      } else if (trx.deliveryStatus === "PROCESSING") {
        list.push({
          id: `order-ship-${trx.id}`,
          title: "Siap dikirim",
          message: `Pesanan ${trx.transactionId} (${trx.customerName}) sudah dikemas dan menunggu dikirim.`,
          time: trx.updatedAt,
          href: "/shipping",
          tone: "info",
        });
      }
    }
  } else {
    // Customer: kabar terbaru tentang pesanan miliknya sendiri.
    const messages: Record<Transaction["deliveryStatus"], [string, NotificationTone]> = {
      PENDING: ["menunggu konfirmasi penjual", "info"],
      PROCESSING: ["sedang dikemas", "info"],
      SHIPPED: ["sedang dalam pengiriman", "info"],
      DELIVERED: ["sudah diterima. Terima kasih!", "success"],
      CANCELLED: ["dibatalkan", "danger"],
    };
    for (const trx of transactions) {
      const [text, tone] = messages[trx.deliveryStatus];
      list.push({
        id: `my-order-${trx.id}-${trx.deliveryStatus}`,
        title: "Status pesanan",
        message: `Pesanan ${trx.transactionId} ${text}`,
        time: trx.updatedAt,
        href: `/transactions/${trx.id}`,
        tone,
      });
    }
  }

  return list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

export function getReadIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

export function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  } catch {
    // abaikan: status baca hanya kenyamanan tampilan
  }
}

export function countUnread(notifications: AppNotification[]) {
  const read = getReadIds();
  return notifications.filter((n) => !read.has(n.id)).length;
}

// Angka badge di sidebar: pesanan menunggu konfirmasi & notifikasi belum dibaca.
export function sidebarBadges(user: User | null, products: Product[], transactions: Transaction[]) {
  return {
    pesanan: transactions.filter((t) => t.deliveryStatus === "PENDING").length,
    notifikasi: countUnread(buildNotifications(user, products, transactions)),
  };
}
