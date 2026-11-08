"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "../lib/api";

// Kerangka halaman admin (sidebar + header) mengikuti desain Figma "web hight fidelity".
// Halaman yang belum dibuat (href null) tetap tampil di menu tapi belum bisa diklik.

type NavItem = {
  label: string;
  href: string | null;
  icon: string;
  iconWidth: number;
  iconHeight: number;
  badgeKey?: "pesanan" | "notifikasi";
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "nav-dashboard", iconWidth: 15, iconHeight: 15 },
  { label: "Produk & Stok", href: "/products", icon: "nav-produk", iconWidth: 16.667, iconHeight: 16.667 },
  { label: "Pesanan", href: null, icon: "nav-pesanan", iconWidth: 13.333, iconHeight: 16.667, badgeKey: "pesanan" },
  { label: "Monitoring Transaksi", href: "/transactions", icon: "nav-transaksi", iconWidth: 15, iconHeight: 16.667 },
  { label: "Notifikasi", href: null, icon: "nav-notifikasi", iconWidth: 20, iconHeight: 20, badgeKey: "notifikasi" },
  { label: "Restok Barang", href: null, icon: "nav-restok", iconWidth: 16.667, iconHeight: 16.583 },
  { label: "Pengiriman", href: null, icon: "nav-pengiriman", iconWidth: 18.333, iconHeight: 13.333 },
  { label: "Pengaturan Sistem", href: "/settings", icon: "nav-pengaturan", iconWidth: 16.75, iconHeight: 16.667 },
];

type AdminShellProps = {
  user: User | null;
  badges?: Partial<Record<"pesanan" | "notifikasi", number>>;
  children: React.ReactNode;
};

export function roleLabel(user: User | null) {
  return user?.role === "ADMIN" ? "Pemilik UMKM" : "Pengguna";
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

export default function AdminShell({ user, badges = {}, children }: AdminShellProps) {
  const pathname = usePathname();
  const displayName = user?.fullName || user?.username || "Pengguna";

  return (
    <div className="adm">
      {/* SIDEBAR */}
      <aside className="adm-sidebar">
        <div className="adm-brand">
          <Image
            src="/figma/logo-ikobana.png"
            alt="Logo Ikobana"
            width={41}
            height={41}
            className="adm-brand-logo"
            loading="eager"
          />
          <div className="adm-brand-text">
            <span className="adm-brand-name">IKOBANA FROZENFOOD</span>
            <span className="adm-brand-tag">UMKM</span>
          </div>
        </div>

        <nav className="adm-nav" aria-label="Menu utama">
          <p className="adm-nav-title">MENU UTAMA</p>

          {NAV_ITEMS.map((item) => {
            const active = item.href !== null && pathname.startsWith(item.href);
            const badge = item.badgeKey ? badges[item.badgeKey] : undefined;
            const content = (
              <>
                <span
                  className="adm-nav-icon"
                  style={{
                    width: item.iconWidth,
                    height: item.iconHeight,
                    maskImage: `url(/figma/${item.icon}.svg)`,
                    WebkitMaskImage: `url(/figma/${item.icon}.svg)`,
                  }}
                  aria-hidden
                />
                <span className="adm-nav-label">{item.label}</span>
                {badge ? <span className="adm-nav-badge">{badge}</span> : null}
              </>
            );

            if (item.href === null) {
              return (
                <span
                  key={item.label}
                  className="adm-nav-item disabled"
                  aria-disabled="true"
                  title="Halaman ini belum tersedia"
                >
                  {content}
                </span>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={active ? "adm-nav-item active" : "adm-nav-item"}
                aria-current={active ? "page" : undefined}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        {/* Semua tombol "Keluar" mengarah ke halaman login, yang me-logout sesi lama. */}
        <Link href="/" className="adm-logout">
          ↪ Keluar
        </Link>
      </aside>

      {/* HEADER */}
      <header className="adm-topbar">
        <span className="adm-topbar-title">Ikobana Admin Hub</span>

        <div className="adm-profile">
          <span className="adm-avatar" aria-hidden>
            {initials(displayName)}
          </span>
          <div>
            <strong>{displayName}</strong>
            <small>{roleLabel(user)}</small>
          </div>
        </div>
      </header>

      <main className="adm-main">{children}</main>
    </div>
  );
}
