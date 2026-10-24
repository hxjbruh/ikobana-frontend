"use client";

import { useEffect, useState } from "react";
import {
  getProfile,
  requireLogin,
  updateProfile,
  type User,
} from "../lib/api";

// Info toko belum disimpan di backend, jadi hanya ditampilkan (tidak bisa diubah).
const STORE_NAME = "Ikobana Frozenfood";
const STORE_ADDRESS = "Malang, Jawa Timur";

type ProfileForm = { fullName: string; email: string; phone: string };

function toForm(user: User | null): ProfileForm {
  return {
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  };
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<ProfileForm>(toForm(null));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Pengaturan bisa dibuka semua user yang sudah login.
  // Data diambil dari backend; kalau gagal, pakai data sesi di browser.
  useEffect(() => {
    const sessionUser = requireLogin();
    if (!sessionUser) return;

    getProfile()
      .catch(() => sessionUser)
      .then((loaded) => {
        setUser(loaded);
        setForm(toForm(loaded));
      });
  }, []);

  const [notification, setNotification] = useState(true);
  const [orderNotification, setOrderNotification] =
    useState(true);

  const displayName = user?.fullName || user?.username || "Pengguna";
  const initial = displayName.charAt(0).toUpperCase();
  const roleLabel = user?.role === "ADMIN" ? "Administrator" : "Pengguna";

  const updateField = (field: keyof ProfileForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleCancel = () => {
    setForm(toForm(user));
    setEditing(false);
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updated = await updateProfile(form);
      setUser(updated);
      setForm(toForm(updated));
      setEditing(false);
      setMessage({ type: "success", text: "Profil berhasil diperbarui." });
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setSaving(false);
    }
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
              {initial}
            </div>

            <div>
              <strong>{displayName}</strong>
              <small>{roleLabel}</small>
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
                {initial}
              </div>

              <div>
                <strong>{displayName}</strong>
                <small>{roleLabel}</small>
              </div>

            </div>

          </div>

        </header>


        {/* PROFIL & INFORMASI TOKO */}
        <form className="settings-card" onSubmit={handleSave}>

          <div className="settings-title">

            <div className="settings-icon">
              🏪
            </div>

            <div>
              <h2>Profil & Informasi Toko</h2>

              <p>
                {editing
                  ? "Ubah data lalu klik Simpan"
                  : "Data akun Anda saat mendaftar"}
              </p>
            </div>

            <div className="settings-title-actions">
              {editing ? (
                <>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="save-button"
                    disabled={saving}
                  >
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="save-button"
                  onClick={() => {
                    setEditing(true);
                    setMessage(null);
                  }}
                  disabled={!user}
                >
                  ✎ Edit Profil
                </button>
              )}
            </div>

          </div>

          {message && (
            <p className={`settings-message ${message.type}`}>
              {message.text}
            </p>
          )}

          <div className="settings-form">

            <div className="form-group">

              <label htmlFor="fullName">
                Nama Lengkap
              </label>

              <input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                readOnly={!editing}
                required
              />

            </div>


            <div className="form-group">

              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                type="text"
                value={user?.username ?? ""}
                readOnly
                title="Username tidak bisa diubah"
              />

            </div>


            <div className="form-group">

              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                readOnly={!editing}
                required
              />

            </div>


            <div className="form-group">

              <label htmlFor="phone">
                Nomor Telepon
              </label>

              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                readOnly={!editing}
                required
              />

            </div>


            <div className="form-group">

              <label htmlFor="storeName">
                Nama Toko
              </label>

              <input
                id="storeName"
                type="text"
                value={STORE_NAME}
                readOnly
              />

            </div>


            <div className="form-group">

              <label htmlFor="storeAddress">
                Alamat Toko
              </label>

              <input
                id="storeAddress"
                type="text"
                value={STORE_ADDRESS}
                readOnly
              />

            </div>

          </div>

        </form>


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


        {/* AKUN PENGGUNA */}
        <section className="settings-card">

          <div className="settings-title">

            <div className="settings-icon">
              👤
            </div>

            <div>

              <h2>Akun Pengguna</h2>

              <p>
                Informasi akun Anda
              </p>

            </div>

          </div>


          <div className="admin-settings">

            <div className="large-avatar">
              {initial}
            </div>

            <div>

              <h3>
                {displayName}
              </h3>

              <p>
                {roleLabel}
              </p>

              <button className="change-password">
                Ubah Password
              </button>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}