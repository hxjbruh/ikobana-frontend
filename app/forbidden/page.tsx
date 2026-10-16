import Link from "next/link";

// Ditampilkan saat user yang sudah login membuka halaman di luar wewenang role-nya.
export default function ForbiddenPage() {
  return (
    <main className="login-page">
      <div className="login-card" style={{ textAlign: "center" }}>

        <div className="logo">
          ⛔
        </div>

        <h1>403 - Akses Ditolak</h1>

        <p className="subtitle">
          Anda tidak memiliki izin untuk membuka halaman ini.
          Halaman ini hanya untuk Admin.
        </p>

        <Link
          href="/dashboard"
          className="login-button"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          Kembali ke Dashboard
        </Link>

      </div>
    </main>
  );
}
