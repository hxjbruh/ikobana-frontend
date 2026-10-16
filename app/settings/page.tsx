"use client";

import { useEffect, useState } from "react";
import { requireLogin } from "../lib/api";

export default function SettingsPage() {
  // Pengaturan toko hanya untuk Admin.
  useEffect(() => {
    requireLogin(["ADMIN"]);
  }, []);

  const [storeName, setStoreName] = useState("Ikobana Frozenfood");
  const [email, setEmail] = useState("admin@ikobana.com");
  const [phone, setPhone] = useState("0812-3456-7890");
  const [address, setAddress] = useState(
    "Malang, Jawa Timur"
  );

  const [notification, setNotification] = useState(true);
  const [orderNotification, setOrderNotification] =
    useState(true);

  const handleSave = () => {
    alert("Pengaturan berhasil disimpan!");
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

          <a
            href="/dashboard"
            className="menu-item"
          >
            <span>▣</span>
            Dashboard
          </a>

          <a
            href="/products"
            className="menu-item"
          >
            <span>▤</span>
            Produk & Stok
          </a>

          <a
            href="/transactions"
            className="menu-item"
          >
            <span>▥</span>
            Transaksi
          </a>

          <a
            href="/settings"
            className="menu-item active"
          >
            <span>⚙</span>
            Pengaturan
          </a>

        </nav>

        <div className="sidebar-bottom">

          <div className="admin-profile">

            <div className="avatar">
              A
            </div>

            <div>
              <strong>Admin</strong>
              <small>Administrator</small>
            </div>

          </div>

          <a
            href="/"
            className="logout"
          >
            ↪ Keluar
          </a>

        </div>

      </aside>


      {/* MAIN CONTENT */}
      <main className="dashboard-content">

        {/* HEADER */}
        <header className="dashboard-header">

          <div>

            <h1>Pengaturan</h1>

            <p>
              Kelola informasi dan pengaturan toko
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
                <strong>Admin</strong>
                <small>Administrator</small>
              </div>

            </div>

          </div>

        </header>


        {/* INFORMASI TOKO */}
        <section className="settings-card">

          <div className="settings-title">

            <div className="settings-icon">
              🏪
            </div>

            <div>
              <h2>Informasi Toko</h2>

              <p>
                Kelola informasi dasar toko Anda
              </p>
            </div>

          </div>


          <div className="settings-form">

            <div className="form-group">

              <label>
                Nama Toko
              </label>

              <input
                type="text"
                value={storeName}
                onChange={(e) =>
                  setStoreName(e.target.value)
                }
              />

            </div>


            <div className="form-group">

              <label>
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

            </div>


            <div className="form-group">

              <label>
                Nomor Telepon
              </label>

              <input
                type="text"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
              />

            </div>


            <div className="form-group">

              <label>
                Alamat Toko
              </label>

              <textarea
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                rows={3}
              />

            </div>

          </div>

        </section>


        {/* NOTIFIKASI */}
        <section className="settings-card">

          <div className="settings-title">

            <div className="settings-icon">
              🔔
            </div>

            <div>

              <h2>Notifikasi</h2>

              <p>
                Atur notifikasi yang ingin Anda terima
              </p>

            </div>

          </div>


          <div className="setting-option">

            <div>

              <strong>
                Notifikasi Umum
              </strong>

              <p>
                Terima pemberitahuan mengenai aktivitas
                toko
              </p>

            </div>

            <button
              className={
                notification
                  ? "toggle active"
                  : "toggle"
              }
              onClick={() =>
                setNotification(!notification)
              }
            >

              <span></span>

            </button>

          </div>


          <div className="setting-option">

            <div>

              <strong>
                Notifikasi Pesanan
              </strong>

              <p>
                Beri tahu ketika ada pesanan baru
              </p>

            </div>

            <button
              className={
                orderNotification
                  ? "toggle active"
                  : "toggle"
              }
              onClick={() =>
                setOrderNotification(
                  !orderNotification
                )
              }
            >

              <span></span>

            </button>

          </div>

        </section>


        {/* AKUN ADMIN */}
        <section className="settings-card">

          <div className="settings-title">

            <div className="settings-icon">
              👤
            </div>

            <div>

              <h2>Akun Admin</h2>

              <p>
                Informasi akun administrator
              </p>

            </div>

          </div>


          <div className="admin-settings">

            <div className="large-avatar">
              A
            </div>

            <div>

              <h3>
                Admin
              </h3>

              <p>
                Administrator
              </p>

              <button className="change-password">
                Ubah Password
              </button>

            </div>

          </div>

        </section>


        {/* BUTTON */}
        <div className="settings-actions">

          <button
            className="save-button"
            onClick={handleSave}
          >
            Simpan Perubahan
          </button>

        </div>

      </main>

    </div>
  );
}