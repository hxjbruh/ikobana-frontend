"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { login, logoutSession } from "./lib/api";

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Semua tombol "Keluar" mengarah ke halaman ini, jadi di sini sesi lama di-logout
  // (token di-blacklist di backend lalu dihapus dari browser).
  useEffect(() => {
    logoutSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">

        {/* LOGO & JUDUL */}
        <div className="auth-logo">
          <Image src="/ikobana-logo.png" alt="Logo Ikobana" width={48} height={49} loading="eager" />
        </div>

        <h1 className="auth-brand">Ikobana Frozenfood</h1>
        <p className="auth-brand-sub">Portal Pengelola</p>

        <h2 className="auth-title">Masuk ke Akun Anda</h2>
        <p className="auth-desc">
          Kelola stok rantai dingin,
          <br />
          operasional kasir harian.
        </p>

        {/* FORM */}
        <form onSubmit={handleLogin} className="auth-form">

          {/* EMAIL — backend login hanya menerima email */}
          <div className="auth-label-row">
            <label htmlFor="email">Email</label>
            <span className="auth-hint">ID Pengguna Resmi</span>
          </div>

          <div className="auth-input">
            <MailIcon />
            <input
              id="email"
              type="email"
              placeholder="nama@ikobana.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="auth-label-row">
            <label htmlFor="password">Kata Sandi</label>
            <a href="#" className="auth-link">Lupa Kata Sandi?</a>
          </div>

          <div className="auth-input">
            <LockIcon />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan kata sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth-eye"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
            >
              <EyeIcon off={showPassword} />
            </button>
          </div>

          {/* ERROR */}
          {error && <p className="auth-error">{error}</p>}

          {/* TOMBOL */}
          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? "Memproses..." : <>Masuk ke Dashboard <ArrowIcon /></>}
          </button>

          <a href="/register" className="auth-btn-secondary">
            Register Sekarang <ArrowIcon />
          </a>

        </form>

        {/* BANTUAN */}
        <p className="auth-footnote">
          Belum memiliki akses toko?{" "}
          <a href="#" className="auth-link">Hubungi Administrator</a>
        </p>

        <div className="auth-help">
          <HeadsetIcon />
          Bantuan Operasional WA:{" "}
          <a href="https://wa.me/6281234567890" className="auth-link">0812-3456-7890</a>
        </div>

        <p className="auth-copyright">
          © 2026 Ikobana Frozen Food. Hak Cipta Dilindungi Undang-Undang.
        </p>

      </div>
    </main>
  );
}

/* =========================
   IKON (garis, mengikuti desain)
========================= */

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function MailIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg {...iconProps}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1" />
    </svg>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg {...iconProps}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M3 3l18 18" />}
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg {...iconProps} width={14} height={14}>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" />
    </svg>
  );
}
