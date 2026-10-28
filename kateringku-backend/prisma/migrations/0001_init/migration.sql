-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "satuan_dasar" AS ENUM ('g', 'ml', 'butir');

-- CreateEnum
CREATE TYPE "status_pesanan" AS ENUM ('baru', 'diproses', 'terkirim', 'lunas', 'batal');

-- CreateEnum
CREATE TYPE "peran_anggota" AS ENUM ('pemilik', 'staf');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usaha" (
    "id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usaha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anggota" (
    "user_id" UUID NOT NULL,
    "usaha_id" UUID NOT NULL,
    "peran" "peran_anggota" NOT NULL DEFAULT 'pemilik',

    CONSTRAINT "anggota_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "bahan" (
    "id" UUID NOT NULL,
    "usaha_id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "satuan" "satuan_dasar" NOT NULL,
    "harga_per_satuan" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "bahan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu" (
    "id" UUID NOT NULL,
    "usaha_id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "harga_jual" DECIMAL(12,0) NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resep" (
    "id" UUID NOT NULL,
    "usaha_id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "bahan_id" UUID NOT NULL,
    "takaran" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "resep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pelanggan" (
    "id" UUID NOT NULL,
    "usaha_id" UUID NOT NULL,
    "nama" TEXT NOT NULL,
    "kontak" TEXT,

    CONSTRAINT "pelanggan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pesanan" (
    "id" UUID NOT NULL,
    "usaha_id" UUID NOT NULL,
    "pelanggan_id" UUID,
    "nama_pelanggan" TEXT NOT NULL,
    "tanggal_kirim" DATE NOT NULL,
    "status" "status_pesanan" NOT NULL DEFAULT 'baru',
    "dp" DECIMAL(12,0) NOT NULL,
    "catatan" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pesanan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_pesanan" (
    "id" UUID NOT NULL,
    "usaha_id" UUID NOT NULL,
    "pesanan_id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "harga_jual_snapshot" DECIMAL(12,0) NOT NULL,
    "hpp_snapshot" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "item_pesanan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bahan_usaha_id_nama_key" ON "bahan"("usaha_id", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "menu_usaha_id_nama_key" ON "menu"("usaha_id", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "resep_menu_id_bahan_id_key" ON "resep"("menu_id", "bahan_id");

-- CreateIndex
CREATE INDEX "pesanan_usaha_id_tanggal_kirim_idx" ON "pesanan"("usaha_id", "tanggal_kirim");

-- CreateIndex
CREATE INDEX "item_pesanan_pesanan_id_idx" ON "item_pesanan"("pesanan_id");

-- CreateIndex
CREATE INDEX "item_pesanan_menu_id_idx" ON "item_pesanan"("menu_id");

-- AddForeignKey
ALTER TABLE "anggota" ADD CONSTRAINT "anggota_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggota" ADD CONSTRAINT "anggota_usaha_id_fkey" FOREIGN KEY ("usaha_id") REFERENCES "usaha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bahan" ADD CONSTRAINT "bahan_usaha_id_fkey" FOREIGN KEY ("usaha_id") REFERENCES "usaha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu" ADD CONSTRAINT "menu_usaha_id_fkey" FOREIGN KEY ("usaha_id") REFERENCES "usaha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resep" ADD CONSTRAINT "resep_usaha_id_fkey" FOREIGN KEY ("usaha_id") REFERENCES "usaha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resep" ADD CONSTRAINT "resep_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resep" ADD CONSTRAINT "resep_bahan_id_fkey" FOREIGN KEY ("bahan_id") REFERENCES "bahan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelanggan" ADD CONSTRAINT "pelanggan_usaha_id_fkey" FOREIGN KEY ("usaha_id") REFERENCES "usaha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_usaha_id_fkey" FOREIGN KEY ("usaha_id") REFERENCES "usaha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_pelanggan_id_fkey" FOREIGN KEY ("pelanggan_id") REFERENCES "pelanggan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_pesanan" ADD CONSTRAINT "item_pesanan_usaha_id_fkey" FOREIGN KEY ("usaha_id") REFERENCES "usaha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_pesanan" ADD CONSTRAINT "item_pesanan_pesanan_id_fkey" FOREIGN KEY ("pesanan_id") REFERENCES "pesanan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_pesanan" ADD CONSTRAINT "item_pesanan_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

