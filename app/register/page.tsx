"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "../lib/api";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak sama");
      return;
    }

    setLoading(true);

    try {
      await register({
        fullName,
        email,
        username,
        phone,
        password,
        confirmPassword,
      });
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page">
      <div className="register-card">

        {/* LOGO */}
        <div className="logo">
          ❄
        </div>

        {/* JUDUL */}
        <h1>Ikobana Frozenfood</h1>

        <p className="subtitle">
          Buat akun baru Anda
        </p>

        {/* FORM */}
        <form onSubmit={handleRegister}>

          {/* NAMA */}
          <label>Nama Lengkap</label>

          <input
            type="text"
            placeholder="Masukkan nama lengkap"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          {/* EMAIL */}
          <label>Email</label>

          <input
            type="email"
            placeholder="Masukkan email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* USERNAME */}
          <label>Username</label>

          <input
            type="text"
            placeholder="Minimal 3 karakter"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            required
          />

          {/* TELEPON */}
          <label>No. Telepon</label>

          <input
            type="tel"
            placeholder="Contoh: 081234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          {/* PASSWORD */}
          <label>Password</label>

          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? "Sembunyikan" : "Lihat"}
            </button>
          </div>

          {/* KONFIRMASI PASSWORD */}
          <label>Konfirmasi Password</label>

          <div className="password-container">
            <input
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              placeholder="Ulangi password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
            >
              {showConfirmPassword
                ? "Sembunyikan"
                : "Lihat"}
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <p style={{ color: "#dc2626", fontSize: "14px", margin: "4px 0" }}>
              {error}
            </p>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Daftar Akun"}
          </button>

        </form>

        {/* LOGIN */}
        <p className="login-text">
          Sudah punya akun?{" "}

          <a href="/">
            Masuk sekarang
          </a>
        </p>

      </div>
    </main>
  );
}
