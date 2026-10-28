# 🍲 KateringKu - Backend Workspace

Workspace proyek backend **KateringKu** (Aplikasi Manajemen Catering UMKM).

## 🚀 Memulai Cepat

Proyek backend utama berada di direktori `kateringku-backend/`.

Anda dapat menjalankan perintah langsung dari root atau dari dalam direktori `kateringku-backend/`:

### Dari Root Workspace:
```bash
# Menjalankan dev server
npm run dev

# Menjalankan pengujian (Vitest)
npm run test

# Menjalankan data seed contoh
npm run seed
```

### Atau masuk ke direktori kateringku-backend:
```bash
cd kateringku-backend
npm install
npm run dev
```

### 🗄️ Database & Prisma (Neon PostgreSQL)

Backend memakai **Prisma** sebagai ORM:
- Skema: `prisma/schema.prisma`
- Migrasi: `prisma/migrations/` (migrasi awal `0001_init` sudah di-baseline ke database)
- Repository: `src/repositories/prismaRepo.ts` (Postgres) dan `src/repositories/memoryRepo.ts` (demo tanpa DB)

**Langkah setup:**

1. Isi `DATABASE_URL` di `.env` (sudah diisi dengan koneksi Neon).
2. Pilih mode lewat `DB_MODE` di `.env`:
   - `postgres` → memakai database Neon lewat Prisma
   - `memory` → demo instan tanpa database (dipakai juga oleh unit/integration test)
3. Sinkronkan skema:

```bash
npm run db:generate   # generate Prisma Client
npm run db:push       # sinkronkan skema langsung (tanpa file migrasi)
npm run db:migrate    # buat + terapkan migrasi baru (development)
npm run db:deploy     # terapkan migrasi yang sudah ada (production/CI)
npm run db:studio     # GUI untuk melihat data
```

**Catatan:**
- Kolom `tanggal_kirim` bertipe `date` disimpan sebagai tengah malam UTC oleh Prisma, jadi format `YYYY-MM-DD` dari aplikasi tidak bergeser zona waktu.
- Foreign key di skema Prisma memakai kolom `id` tunggal (idiom Prisma); penjagaan multi-tenancy (`usaha_id` tetap di usaha yang sama) tetap dilakukan di level repository, sama seperti implementasi sebelumnya.

### 📚 Dokumentasi Interaktif & API Docs:
Setelah server berjalan, buka browser ke:
👉 **http://localhost:3001/api/docs**

Dokumentasi lengkap dan spesifikasi teknis dapat dilihat di:
- [kateringku-backend/README.md](file:///c:/Users/LENOVO/Downloads/kateringku-backend/kateringku-backend/README.md)
- [KateringKu-Dokumen-Lengkap.pdf](file:///c:/Users/LENOVO/Downloads/kateringku-backend/KateringKu-Dokumen-Lengkap.pdf)
