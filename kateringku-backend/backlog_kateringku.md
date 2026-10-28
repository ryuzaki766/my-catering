# 📋 Backlog Proyek — KateringKu Backend

> **Aplikasi Manajemen Catering UMKM** | Stack: Node.js · Express · TypeScript · PostgreSQL / Supabase  
> Terakhir diperbarui: 7 Oktober 2026

---

## 🏷️ Legenda Status

| Simbol | Keterangan |
|--------|-----------|
| ✅ | Selesai |
| ❌ | Belum selesai |

---

## 🧩 Epic 1 — User Stories & Fitur Utama

| ID | User Story | Deskripsi Singkat | Status |
|----|-----------|-------------------|--------|
| US-01 | Autentikasi & Multi-Usaha | Register, Login, JWT auth, pencegahan usaha ganda per pengguna, isolasi tenant (`usaha_id`) | ✅ |
| US-02 | Manajemen Bahan Baku | Satuan dasar (`g`, `ml`, `butir`), validasi harga non-negatif, proteksi hapus jika bahan dipakai di resep | ✅ |
| US-03 | Manajemen Menu & Resep | CRUD Menu, pencegahan bahan ganda di 1 resep, kalkulasi HPP otomatis, perhitungan laba kotor & margin | ✅ |
| US-04 | Pencatatan Pesanan Atomik | Transaksi atomik, validasi DP, snapshot harga jual & HPP historis | ✅ |
| US-05 | Rekap Produksi | Total porsi per menu berdasarkan rentang tanggal, eksklusi pesanan batal, rincian pesanan terkait | ✅ |
| US-06 | Kebutuhan Bahan (Daftar Belanja) | Penggabungan kebutuhan bahan, konversi satuan pintar (g→kg, ml→liter), estimasi biaya | ✅ |
| US-07 | Analisis HPP & Margin | Hitungan HPP real-time per menu dan per item resep, visualisasi persentase margin | ✅ |
| US-08 | Alur Status Pesanan | Transisi status (`baru` → `diproses` → `terkirim` → `lunas`), endpoint advance-status, pembatalan | ✅ |
| US-09 | Format WhatsApp Belanja | Generator teks daftar belanja siap salin/kirim ke WhatsApp | ✅ |
| US-10 | Ringkasan Beranda (Dashboard) | Metrik pesanan hari ini, porsi, omzet bulan ini, laba kotor, margin, daftar pesanan terdekat | ✅ |

---

## 🔌 Epic 2 — Endpoint REST API

### 2.1 Autentikasi (`/api/auth`)

| # | Endpoint | Deskripsi | Status |
|---|---------|-----------|--------|
| 1 | `POST /api/auth/register` | Daftarkan akun pemilik katering baru & buat usaha | ✅ |
| 2 | `POST /api/auth/login` | Masuk dan peroleh token JWT | ✅ |
| 3 | `GET /api/auth/me` | Informasi pengguna & profil usaha aktif | ✅ |
| 4 | `POST /api/auth/logout` | Keluar dari sesi | ✅ |
| 5 | `POST /api/auth/usaha` | Hubungkan usaha baru (hanya jika belum punya) | ✅ |

### 2.2 Onboarding (`/api/onboarding`)

| # | Endpoint | Deskripsi | Status |
|---|---------|-----------|--------|
| 6 | `POST /api/onboarding/seed` | Isi 6 bahan contoh, 3 menu contoh & resep standar (hanya jika data kosong) | ✅ |

### 2.3 Bahan Baku (`/api/bahan`)

| # | Endpoint | Deskripsi | Status |
|---|---------|-----------|--------|
| 7 | `GET /api/bahan` | Daftar seluruh bahan baku usaha | ✅ |
| 8 | `GET /api/bahan/:id` | Detail satu bahan | ✅ |
| 9 | `POST /api/bahan` | Tambah bahan baru (satuan & validasi harga) | ✅ |
| 10 | `PUT /api/bahan/:id` | Perbarui nama, satuan, atau harga bahan | ✅ |
| 11 | `DELETE /api/bahan/:id` | Hapus bahan (ditolak jika dipakai di resep) | ✅ |

### 2.4 Menu & Resep (`/api/menu`)

| # | Endpoint | Deskripsi | Status |
|---|---------|-----------|--------|
| 12 | `GET /api/menu` | Daftar menu + HPP, laba kotor & margin | ✅ |
| 13 | `GET /api/menu/:id` | Detail menu + komposisi bahan & subtotal biaya | ✅ |
| 14 | `POST /api/menu` | Tambah menu baru | ✅ |
| 15 | `PUT /api/menu/:id` | Perbarui menu (nama, harga jual, status aktif) | ✅ |
| 16 | `DELETE /api/menu/:id` | Hapus menu beserta resep terkait | ✅ |
| 17 | `GET /api/menu/:menuId/resep` | Lihat komposisi resep menu | ✅ |
| 18 | `PUT /api/menu/:menuId/resep` | Atur/ubah daftar bahan & takaran resep | ✅ |
| 19 | `DELETE /api/menu/:menuId/resep/:bahanId` | Hapus bahan tertentu dari resep | ✅ |

### 2.5 Pesanan (`/api/pesanan`)

| # | Endpoint | Deskripsi | Status |
|---|---------|-----------|--------|
| 20 | `GET /api/pesanan` | Daftar pesanan (filter: tanggal, status) | ✅ |
| 21 | `GET /api/pesanan/:id` | Detail pesanan lengkap (item, HPP, laba, sisa bayar) | ✅ |
| 22 | `POST /api/pesanan` | Buat pesanan baru secara atomik + snapshot harga & HPP | ✅ |
| 23 | `PATCH /api/pesanan/:id/status` | Ubah status pesanan manual | ✅ |
| 24 | `POST /api/pesanan/:id/advance-status` | Majukan status secara berurutan (one-tap) | ✅ |
| 25 | `POST /api/pesanan/:id/batal` | Batalkan pesanan | ✅ |
| 26 | `DELETE /api/pesanan/:id` | Hapus pesanan | ✅ |

### 2.6 Produksi (`/api/produksi`)

| # | Endpoint | Deskripsi | Status |
|---|---------|-----------|--------|
| 27 | `GET /api/produksi` | Rekap total porsi per menu (preset/rentang tanggal kustom) | ✅ |

### 2.7 Belanja (`/api/belanja`)

| # | Endpoint | Deskripsi | Status |
|---|---------|-----------|--------|
| 28 | `GET /api/belanja` | Rekap kebutuhan bahan, konversi satuan, estimasi biaya & teks WhatsApp | ✅ |

### 2.8 Dashboard (`/api/dashboard`)

| # | Endpoint | Deskripsi | Status |
|---|---------|-----------|--------|
| 29 | `GET /api/dashboard` | Ringkasan beranda: pesanan, porsi, omzet, laba, margin, pesanan terdekat | ✅ |

---

## 🛡️ Epic 3 — Keamanan & Isolasi Data

| # | Item | Deskripsi | Status |
|---|------|-----------|--------|
| 1 | Composite Tenant Scoping | Setiap entitas dikaitkan `usaha_id`; pengguna hanya akses data usaha sendiri | ✅ |
| 2 | Row Level Security (RLS) | PostgreSQL RLS + composite foreign keys `(usaha_id, id)` pada mode Supabase | ✅ |
| 3 | Snapshot Immutability | Harga jual & HPP di-snapshot saat pesanan dibuat (tidak terpengaruh kenaikan harga bahan) | ✅ |
| 4 | Proteksi Rute Privat | Seluruh rute bisnis memerlukan token JWT yang sah | ✅ |

---

## 🧪 Epic 4 — Testing & Kualitas Kode

| # | Item | Deskripsi | Status |
|---|------|-----------|--------|
| 1 | Unit Test — Kalkulasi HPP | `hitung.test.ts` | ✅ |
| 2 | Unit Test — Format Output | `format.test.ts` | ✅ |
| 3 | Unit Test — Validasi Skema | `validasi.test.ts` | ✅ |
| 4 | Integration Test — API (TC-01 s/d TC-26) | `api.test.ts` — 26 skenario uji integrasi | ✅ |
| 5 | Integration Test — Keamanan (SEC-01 s/d SEC-06) | 6 skenario uji isolasi & autentikasi | ✅ |
| 6 | Total 30 Test Suite Lulus 100% | Dijalankan via `npm test` (Vitest + Supertest) | ✅ |

---

## 🏗️ Epic 5 — Infrastruktur & DevOps

| # | Item | Deskripsi | Status |
|---|------|-----------|--------|
| 1 | Mode In-Memory (`DB_MODE=memory`) | Berjalan instan tanpa database eksternal untuk dev/testing | ✅ |
| 2 | Mode PostgreSQL / Supabase (`DB_MODE=postgres`) | Connection pool + isolasi skema `usaha_id` | ✅ |
| 3 | Migrasi SQL & PL/pgSQL | Skrip migrasi di `supabase/migrations/` | ✅ |
| 4 | Uji Isolasi RLS Database | Skrip psql di `supabase/tests/` | ✅ |
| 5 | Dockerfile | Konfigurasi container build | ✅ |
| 6 | Docker Compose | Orkestrasi PostgreSQL + API Server | ✅ |
| 7 | Environment Config (`.env.example`) | Template variabel lingkungan | ✅ |
| 8 | Script Seeding Data Contoh | `npm run seed` — demo akun, usaha, 6 bahan, 3 menu & resep | ✅ |
| 9 | Dokumentasi Interaktif Swagger UI | Tersedia di `http://localhost:3001/api/docs` | ✅ |

---

## 📌 Ringkasan Progress

| Epic | Total Item | Selesai | Belum Selesai |
|------|-----------|---------|---------------|
| Epic 1 — User Stories | 10 | 10 ✅ | 0 ❌ |
| Epic 2 — REST API Endpoints | 29 | 29 ✅ | 0 ❌ |
| Epic 3 — Keamanan & Isolasi | 4 | 4 ✅ | 0 ❌ |
| Epic 4 — Testing & Kualitas | 6 | 6 ✅ | 0 ❌ |
| Epic 5 — Infrastruktur & DevOps | 9 | 9 ✅ | 0 ❌ |
| **TOTAL** | **58** | **58 ✅** | **0 ❌** |

> 🎉 **Semua fitur yang terdaftar telah selesai diimplementasikan!**
