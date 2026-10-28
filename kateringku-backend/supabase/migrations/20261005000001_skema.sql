-- ============================================================
-- KateringKu | Migrasi 1: skema dasar
-- Multi-usaha: setiap tabel punya usaha_id. Relasi memakai kunci
-- komposit (usaha_id, id) agar baris satu usaha TIDAK BISA
-- menunjuk baris usaha lain (dijaga di level database).
-- ============================================================

create type satuan_dasar   as enum ('g', 'ml', 'butir');
create type status_pesanan as enum ('baru', 'diproses', 'terkirim', 'lunas', 'batal');

create table usaha (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null check (btrim(nama) <> ''),
  dibuat_pada timestamptz not null default now()
);

create table anggota (
  user_id  uuid primary key references auth.users on delete cascade,
  usaha_id uuid not null references usaha on delete cascade,
  peran    text not null default 'pemilik'
);

-- Usaha milik pengguna yang sedang login (dipakai RLS dan nilai default)
create function usaha_saya() returns uuid
language sql stable security definer set search_path = public as
$$ select usaha_id from anggota where user_id = auth.uid() $$;

create table bahan (
  id               uuid primary key default gen_random_uuid(),
  usaha_id         uuid not null default usaha_saya() references usaha on delete cascade,
  nama             text not null check (btrim(nama) <> ''),
  satuan           satuan_dasar not null,
  harga_per_satuan numeric(12,2) not null check (harga_per_satuan >= 0),
  unique (usaha_id, id),
  unique (usaha_id, nama)
);

create table menu (
  id         uuid primary key default gen_random_uuid(),
  usaha_id   uuid not null default usaha_saya() references usaha on delete cascade,
  nama       text not null check (btrim(nama) <> ''),
  harga_jual numeric(12,0) not null check (harga_jual >= 0),
  aktif      boolean not null default true,
  unique (usaha_id, id),
  unique (usaha_id, nama)
);

create table resep (
  id       uuid primary key default gen_random_uuid(),
  usaha_id uuid not null default usaha_saya() references usaha on delete cascade,
  menu_id  uuid not null,
  bahan_id uuid not null,
  takaran  numeric(10,2) not null check (takaran > 0),
  unique (menu_id, bahan_id),
  foreign key (usaha_id, menu_id)  references menu  (usaha_id, id) on delete cascade,
  foreign key (usaha_id, bahan_id) references bahan (usaha_id, id) on delete restrict
);

create table pelanggan (
  id       uuid primary key default gen_random_uuid(),
  usaha_id uuid not null default usaha_saya() references usaha on delete cascade,
  nama     text not null check (btrim(nama) <> ''),
  kontak   text,
  unique (usaha_id, id)
);

create table pesanan (
  id             uuid primary key default gen_random_uuid(),
  usaha_id       uuid not null default usaha_saya() references usaha on delete cascade,
  pelanggan_id   uuid,
  nama_pelanggan text not null check (btrim(nama_pelanggan) <> ''),
  tanggal_kirim  date not null,
  status         status_pesanan not null default 'baru',
  dp             numeric(12,0) not null default 0 check (dp >= 0),
  catatan        text,
  dibuat_pada    timestamptz not null default now(),
  unique (usaha_id, id),
  foreign key (usaha_id, pelanggan_id) references pelanggan (usaha_id, id)
    on delete set null (pelanggan_id)
);
create index on pesanan (usaha_id, tanggal_kirim);

create table item_pesanan (
  id                  uuid primary key default gen_random_uuid(),
  usaha_id            uuid not null default usaha_saya() references usaha on delete cascade,
  pesanan_id          uuid not null,
  menu_id             uuid not null,
  jumlah              int not null check (jumlah > 0),
  harga_jual_snapshot numeric(12,0) not null default 0,
  hpp_snapshot        numeric(12,2) not null default 0,
  foreign key (usaha_id, pesanan_id) references pesanan (usaha_id, id) on delete cascade,
  foreign key (usaha_id, menu_id)    references menu    (usaha_id, id) on delete restrict
);
create index on item_pesanan (pesanan_id);
create index on item_pesanan (menu_id);
