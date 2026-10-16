# Ikobana Frozen Food — Frontend

Aplikasi web (admin panel) untuk toko **Ikobana Frozen Food**, dibangun dengan Next.js 16 dan React 19.
Data diambil dari backend Spring Boot lewat REST API.

- **Backend:** https://github.com/hxjbruh/ikobana-backend
- **Desain Figma (PBL UAS):** [Desain PBL](https://www.figma.com/design/pEZ0bPbguRyatocuvTZjlr/Desain-PBL?node-id=1-2732&t=A5jZoRNV2Z0qw2Bt-1)
- Dokumentasi lengkap autentikasi & otorisasi (Tugas #9) ada di README backend.

## Menjalankan

Backend harus jalan dulu di `http://localhost:8080` (lihat README backend), lalu:

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Alamat backend bisa diganti lewat `NEXT_PUBLIC_API_URL` di file `.env.local`.

## Akun Dummy

| Role | Email | Password |
|---|---|---|
| Admin | `admin@ikobana.com` | `Admin@12345` |
| Customer | `customer@ikobana.com` | `Customer@12345` |

## Autentikasi & Otorisasi di Frontend

- `app/lib/api.ts` — semua pemanggilan API, penyimpanan token JWT, dan guard `requireLogin(allowedRoles?)`
- Login (`/`) menyimpan token; setiap request mengirim `Authorization: Bearer <token>`
- **Keluar** memanggil `POST /api/auth/logout` (token di-blacklist di backend) lalu menghapus sesi di browser
- Token tidak valid / sudah logout (401) → otomatis kembali ke halaman login

| Halaman | Belum login | Customer | Admin |
|---|---|---|---|
| `/dashboard`, `/products`, `/transactions`, `/transactions/[id]` | ke login | ✅ (read-only) | ✅ |
| `/products/add`, `/products/edit/[id]`, `/settings` | ke login | ke `/forbidden` (403) | ✅ |
| Tombol tambah/edit/hapus produk, ubah status transaksi | — | disembunyikan | tampil |

Guard di UI hanya untuk tampilan; keamanan utama tetap di backend (Spring Security).
