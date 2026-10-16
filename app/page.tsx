"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    <main className="login-page">
      <div className="login-card">

        {/* LOGO */}
        <div className="logo">
          ❄
        </div>

        {/* JUDUL */}
        <h1>Ikobana Frozenfood</h1>

        <p className="subtitle">
          Masuk ke akun Anda
        </p>

        {/* FORM */}
        <form onSubmit={handleLogin}>

          {/* EMAIL */}
          <label>Email</label>

          <input
            type="email"
            placeholder="Masukkan email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* PASSWORD */}
          <label>Password</label>

          <div className="password-container">

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Sembunyikan" : "Lihat"}
            </button>

          </div>

          {/* INGAT & LUPA PASSWORD */}
          <div className="login-option">

            <label className="remember">
              <input type="checkbox" />
              Ingat saya
            </label>

            <a href="#">
              Lupa password?
            </a>

          </div>

          {/* ERROR */}
          {error && (
            <p style={{ color: "#dc2626", fontSize: "14px", margin: "4px 0" }}>
              {error}
            </p>
          )}

          {/* BUTTON LOGIN */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk ke Dashboard"}
          </button>

          {/* GOOGLE */}
          <button
            type="button"
            className="google-button"
          >
            G &nbsp; Masuk dengan Google
          </button>

        </form>

        {/* DAFTAR */}
        <p className="register-text">

          Belum punya akun?{" "}

          <a href="/register">
            Daftar sekarang
          </a>

        </p>

      </div>
    </main>
  );
}