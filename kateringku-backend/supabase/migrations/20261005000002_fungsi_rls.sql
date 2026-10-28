-- ============================================================
-- KateringKu | Migrasi 2: fungsi, trigger, RLS, hak akses
-- ============================================================

-- HPP per porsi = jumlah (takaran x harga satuan bahan)
create function hpp_menu(p_menu uuid) returns numeric
language sql stable set search_path = public as
$$ select coalesce(sum(r.takaran * b.harga_per_satuan), 0)
   from resep r join bahan b on b.id = r.bahan_id
   where r.menu_id = p_menu $$;

-- Snapshot harga jual dan HPP saat item pesanan dibuat
create function snapshot_item() returns trigger
language plpgsql set search_path = public as $$
begin
  select harga_jual into new.harga_jual_snapshot from menu where id = new.menu_id;
  new.hpp_snapshot := hpp_menu(new.menu_id);
  return new;
end $$;

create trigger trg_snapshot before insert on item_pesanan
  for each row execute function snapshot_item();

-- Pendaftaran: buat usaha dan hubungkan ke pengguna yang login
create function buat_usaha(p_nama text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Harus masuk terlebih dahulu' using errcode = '42501';
  end if;
  if exists (select 1 from anggota where user_id = auth.uid()) then
    raise exception 'Pengguna sudah punya usaha' using errcode = '23505';
  end if;
  insert into usaha(nama) values (p_nama) returning id into v_id;
  insert into anggota(user_id, usaha_id) values (auth.uid(), v_id);
  return v_id;
end $$;

-- Pesanan + item dalam satu transaksi (atomik), dengan validasi
-- p_data = {nama_pelanggan, tanggal_kirim, dp, catatan, pelanggan_id?,
--           items: [{menu_id, jumlah}, ...]}
create function buat_pesanan(p_data jsonb) returns uuid
language plpgsql set search_path = public as $$
declare
  v_nama  text    := nullif(btrim(p_data->>'nama_pelanggan'), '');
  v_tgl   date    := (p_data->>'tanggal_kirim')::date;
  v_dp    numeric := coalesce((p_data->>'dp')::numeric, 0);
  v_items jsonb   := p_data->'items';
  v_cocok int;
  v_total numeric;
  v_id    uuid;
begin
  if v_nama is null then
    raise exception 'Nama pelanggan wajib diisi' using errcode = '22023';
  end if;
  if v_tgl is null then
    raise exception 'Tanggal kirim wajib diisi' using errcode = '22023';
  end if;
  if v_items is null or jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 then
    raise exception 'Isi minimal satu menu' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(v_items) i
             where coalesce((i->>'jumlah')::int, 0) <= 0) then
    raise exception 'Jumlah tiap menu harus lebih dari 0' using errcode = '22023';
  end if;
  if v_dp < 0 then
    raise exception 'DP tidak boleh negatif' using errcode = '22023';
  end if;

  select count(*), sum((i->>'jumlah')::int * m.harga_jual)
    into v_cocok, v_total
  from jsonb_array_elements(v_items) i
  join menu m on m.id = (i->>'menu_id')::uuid and m.aktif;

  if v_cocok <> jsonb_array_length(v_items) then
    raise exception 'Ada menu yang tidak ditemukan atau tidak aktif' using errcode = '22023';
  end if;
  if v_dp > v_total then
    raise exception 'DP melebihi total pesanan' using errcode = '22023';
  end if;

  insert into pesanan(pelanggan_id, nama_pelanggan, tanggal_kirim, dp, catatan)
  values ((p_data->>'pelanggan_id')::uuid, v_nama, v_tgl, v_dp, p_data->>'catatan')
  returning id into v_id;

  insert into item_pesanan(pesanan_id, menu_id, jumlah)
  select v_id, (i->>'menu_id')::uuid, (i->>'jumlah')::int
  from jsonb_array_elements(v_items) i;

  return v_id;
end $$;

-- Rekap produksi: total porsi per menu pada rentang tanggal
create function rekap_produksi(p_mulai date, p_akhir date)
returns table (menu_id uuid, nama text, total_porsi bigint)
language sql stable set search_path = public as $$
  select m.id, m.nama, sum(ip.jumlah)::bigint
  from item_pesanan ip
  join pesanan p on p.id = ip.pesanan_id
  join menu m on m.id = ip.menu_id
  where p.tanggal_kirim between p_mulai and p_akhir and p.status <> 'batal'
  group by m.id, m.nama order by m.nama $$;

-- Daftar belanja: kebutuhan bahan dan biaya (satuan dasar: g, ml, butir)
create function kebutuhan_bahan(p_mulai date, p_akhir date)
returns table (bahan_id uuid, nama text, satuan satuan_dasar, total numeric, biaya numeric)
language sql stable set search_path = public as $$
  select b.id, b.nama, b.satuan,
         sum(ip.jumlah * r.takaran),
         sum(ip.jumlah * r.takaran * b.harga_per_satuan)
  from item_pesanan ip
  join pesanan p on p.id = ip.pesanan_id
  join resep r   on r.menu_id = ip.menu_id
  join bahan b   on b.id = r.bahan_id
  where p.tanggal_kirim between p_mulai and p_akhir and p.status <> 'batal'
  group by b.id, b.nama, b.satuan order by b.nama $$;

-- Menu yang dipesan pada rentang tanggal tetapi belum punya resep (untuk peringatan UI)
create function menu_tanpa_resep(p_mulai date, p_akhir date)
returns table (menu_id uuid, nama text)
language sql stable set search_path = public as $$
  select distinct m.id, m.nama
  from item_pesanan ip
  join pesanan p on p.id = ip.pesanan_id
  join menu m on m.id = ip.menu_id
  where p.tanggal_kirim between p_mulai and p_akhir and p.status <> 'batal'
    and not exists (select 1 from resep r where r.menu_id = m.id)
  order by m.nama $$;

-- Ringkasan beranda (dashboard)
create function ringkasan_beranda(p_tanggal date default current_date)
returns table (pesanan_hari_ini bigint, porsi_hari_ini bigint,
               omzet_bulan_ini numeric, laba_kotor_bulan_ini numeric)
language sql stable set search_path = public as $$
  select
    count(distinct p.id) filter (where p.tanggal_kirim = p_tanggal),
    coalesce(sum(ip.jumlah) filter (where p.tanggal_kirim = p_tanggal), 0)::bigint,
    coalesce(sum(ip.jumlah * ip.harga_jual_snapshot), 0),
    coalesce(sum(ip.jumlah * (ip.harga_jual_snapshot - ip.hpp_snapshot)), 0)
  from pesanan p
  join item_pesanan ip on ip.pesanan_id = p.id
  where p.status <> 'batal'
    and date_trunc('month', p.tanggal_kirim) = date_trunc('month', p_tanggal) $$;

-- Data contoh untuk onboarding (hanya jika usaha masih kosong)
create function isi_contoh_data() returns void
language plpgsql set search_path = public as $$
begin
  if usaha_saya() is null then
    raise exception 'Belum punya usaha' using errcode = '42501';
  end if;
  if exists (select 1 from bahan) or exists (select 1 from menu) then
    raise exception 'Data sudah ada, contoh tidak ditambahkan' using errcode = '23505';
  end if;
  insert into bahan(nama, satuan, harga_per_satuan) values
    ('Beras','g',14), ('Ayam','g',38), ('Telur','butir',2200),
    ('Sayuran','g',12), ('Minyak goreng','ml',18), ('Bumbu','g',40);
  insert into menu(nama, harga_jual) values
    ('Nasi Box Ayam Goreng',25000), ('Nasi Box Telur Balado',20000), ('Nasi Kuning Komplit',22000);
  insert into resep(menu_id, bahan_id, takaran)
  select m.id, b.id, x.takaran
  from (values
    ('Nasi Box Ayam Goreng','Beras',150), ('Nasi Box Ayam Goreng','Ayam',120),
    ('Nasi Box Ayam Goreng','Sayuran',60), ('Nasi Box Ayam Goreng','Minyak goreng',15),
    ('Nasi Box Ayam Goreng','Bumbu',10),
    ('Nasi Box Telur Balado','Beras',150), ('Nasi Box Telur Balado','Telur',1),
    ('Nasi Box Telur Balado','Sayuran',60), ('Nasi Box Telur Balado','Minyak goreng',15),
    ('Nasi Box Telur Balado','Bumbu',15),
    ('Nasi Kuning Komplit','Beras',150), ('Nasi Kuning Komplit','Ayam',80),
    ('Nasi Kuning Komplit','Telur',1), ('Nasi Kuning Komplit','Sayuran',40),
    ('Nasi Kuning Komplit','Minyak goreng',10), ('Nasi Kuning Komplit','Bumbu',10)
  ) x(menu_nama, bahan_nama, takaran)
  join menu m  on m.nama = x.menu_nama
  join bahan b on b.nama = x.bahan_nama;
end $$;

-- ---------------- Row Level Security ----------------
alter table usaha   enable row level security;
alter table anggota enable row level security;
create policy usaha_baca   on usaha    for select to authenticated using (id = usaha_saya());
create policy usaha_ubah   on usaha    for update to authenticated using (id = usaha_saya()) with check (id = usaha_saya());
create policy anggota_baca on anggota  for select to authenticated using (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['bahan','menu','resep','pelanggan','pesanan','item_pesanan'] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for all to authenticated '
      'using (usaha_id = usaha_saya()) with check (usaha_id = usaha_saya())',
      t || '_isolasi', t);
  end loop;
end $$;

-- ---------------- Hak akses ----------------
-- Tamu (anon) tidak boleh menyentuh data atau fungsi apa pun.
revoke all on all tables in schema public from anon;
revoke all on function usaha_saya(), hpp_menu(uuid), snapshot_item(), buat_usaha(text),
  buat_pesanan(jsonb), rekap_produksi(date, date), kebutuhan_bahan(date, date),
  menu_tanpa_resep(date, date), ringkasan_beranda(date), isi_contoh_data()
  from public, anon;
grant execute on function usaha_saya(), hpp_menu(uuid), buat_usaha(text), buat_pesanan(jsonb),
  rekap_produksi(date, date), kebutuhan_bahan(date, date), menu_tanpa_resep(date, date),
  ringkasan_beranda(date), isi_contoh_data() to authenticated;
