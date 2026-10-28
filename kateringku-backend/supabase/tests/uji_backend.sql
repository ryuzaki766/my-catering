-- ============================================================
-- KateringKu | Uji backend (SEC-01..06, TC-11..23)
-- Jalankan: psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/uji_backend.sql
-- Semua perubahan di-ROLLBACK di akhir, aman dijalankan berulang.
-- ============================================================
begin;

create table public.uji_ctx (k text primary key, v text);
grant all on public.uji_ctx to authenticated, anon;

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@uji.test'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b@uji.test');

-- ===================== Pengguna A =====================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true);

do $$
declare m_ayam uuid; m_telur uuid; m_kuning uuid; p1 uuid; p2 uuid; n int; v numeric;
begin
  perform buat_usaha('Catering A');
  perform isi_contoh_data();
  assert (select count(*) from bahan) = 6, 'contoh: 6 bahan';
  assert (select count(*) from menu) = 3,  'contoh: 3 menu';

  select id into m_ayam   from menu where nama = 'Nasi Box Ayam Goreng';
  select id into m_telur  from menu where nama = 'Nasi Box Telur Balado';
  select id into m_kuning from menu where nama = 'Nasi Kuning Komplit';

  -- TC-21: HPP sesuai hitungan manual
  assert hpp_menu(m_ayam) = 8050, 'HPP ayam harus 8050, dapat ' || hpp_menu(m_ayam);

  -- TC-11: pesanan valid, atomik
  p1 := buat_pesanan(jsonb_build_object('nama_pelanggan','Kantor Sari','tanggal_kirim',current_date,'dp',500000,
        'items', jsonb_build_array(jsonb_build_object('menu_id',m_ayam,'jumlah',40),
                                   jsonb_build_object('menu_id',m_telur,'jumlah',10))));
  p2 := buat_pesanan(jsonb_build_object('nama_pelanggan','Bu Wati','tanggal_kirim',current_date + 1,'dp',0,
        'items', jsonb_build_array(jsonb_build_object('menu_id',m_kuning,'jumlah',30))));
  assert (select count(*) from item_pesanan where pesanan_id = p1) = 2, 'p1 punya 2 item';
  insert into public.uji_ctx values ('p1', p1::text), ('m_ayam', m_ayam::text);

  -- TC-12, TC-13 dan validasi lain
  begin perform buat_pesanan(jsonb_build_object('nama_pelanggan','X','tanggal_kirim',current_date,'items','[]'::jsonb));
        raise exception 'seharusnya gagal: tanpa item';
  exception when sqlstate '22023' then null; end;
  begin perform buat_pesanan(jsonb_build_object('nama_pelanggan','X','tanggal_kirim',current_date,'dp',99999999,
          'items', jsonb_build_array(jsonb_build_object('menu_id',m_ayam,'jumlah',1))));
        raise exception 'seharusnya gagal: DP melebihi total';
  exception when sqlstate '22023' then null; end;
  begin perform buat_pesanan(jsonb_build_object('nama_pelanggan','X','tanggal_kirim',current_date,
          'items', jsonb_build_array(jsonb_build_object('menu_id',m_ayam,'jumlah',0))));
        raise exception 'seharusnya gagal: jumlah 0';
  exception when sqlstate '22023' then null; end;
  begin perform buat_pesanan(jsonb_build_object('nama_pelanggan','X','tanggal_kirim',current_date,
          'items', jsonb_build_array(jsonb_build_object('menu_id',gen_random_uuid(),'jumlah',1))));
        raise exception 'seharusnya gagal: menu tidak ada';
  exception when sqlstate '22023' then null; end;
  assert (select count(*) from pesanan) = 2, 'pesanan gagal tidak boleh tersisa (atomik)';

  -- TC-15, TC-18, TC-19: rekap dan kebutuhan bahan
  assert (select total_porsi from rekap_produksi(current_date, current_date) where menu_id = m_ayam) = 40, 'rekap ayam = 40';
  select total into v from kebutuhan_bahan(current_date, current_date) where nama = 'Beras';
  assert v = 7500, 'beras hari ini = 50 porsi x 150 g = 7500, dapat ' || v;
  assert (select count(*) from kebutuhan_bahan(current_date, current_date) where nama = 'Beras') = 1, 'beras digabung satu baris';

  -- TC-23: snapshot historis tidak berubah saat harga bahan naik
  update bahan set harga_per_satuan = 20 where nama = 'Beras';
  assert hpp_menu(m_ayam) > 8050, 'HPP baru naik';
  assert (select hpp_snapshot from item_pesanan where pesanan_id = p1 and menu_id = m_ayam) = 8050, 'snapshot lama tetap 8050';

  -- TC-16: pesanan batal tidak masuk rekap
  update pesanan set status = 'batal' where id = p2;
  assert (select count(*) from rekap_produksi(current_date + 1, current_date + 1)) = 0, 'batal tidak masuk rekap';

  -- TC-20: menu tanpa resep terdeteksi
  insert into menu(nama, harga_jual) values ('Menu Baru', 10000);
  p2 := buat_pesanan(jsonb_build_object('nama_pelanggan','Z','tanggal_kirim',current_date + 5,
        'items', jsonb_build_array(jsonb_build_object('menu_id',(select id from menu where nama='Menu Baru'),'jumlah',3))));
  assert (select count(*) from menu_tanpa_resep(current_date + 5, current_date + 5)) = 1, 'menu tanpa resep terdeteksi';

  -- Bahan terpakai resep tidak bisa dihapus (TC-10)
  begin delete from bahan where nama = 'Ayam'; raise exception 'seharusnya gagal: bahan terpakai';
  exception when foreign_key_violation then null; end;

  -- SEC-06: pengguna yang sudah punya usaha tidak bisa buat lagi
  begin perform buat_usaha('Ganda'); raise exception 'seharusnya gagal: usaha ganda';
  exception when unique_violation then null; end;

  -- Dashboard
  assert (select pesanan_hari_ini from ringkasan_beranda()) = 1, 'dashboard: 1 pesanan hari ini';
end $$;

-- ===================== Pengguna B =====================
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', true);

do $$
declare a_usaha uuid; a_pesanan uuid; n int;
begin
  perform buat_usaha('Catering B');
  select v::uuid into a_pesanan from public.uji_ctx where k = 'p1';
  select usaha_id into a_usaha from anggota limit 1;  -- hanya baris B yang terlihat

  -- SEC-01: tidak melihat data usaha A
  assert (select count(*) from pesanan) = 0, 'SEC-01 pesanan';
  assert (select count(*) from bahan)   = 0, 'SEC-01 bahan';
  assert (select count(*) from menu)    = 0, 'SEC-01 menu';
  assert (select count(*) from usaha)   = 1, 'SEC-01 hanya usaha sendiri';

  -- SEC-02: tidak bisa mengubah/menghapus baris usaha A
  update pesanan set status = 'lunas' where id = a_pesanan;
  get diagnostics n = row_count;  assert n = 0, 'SEC-02 update 0 baris';
  delete from pesanan where id = a_pesanan;
  get diagnostics n = row_count;  assert n = 0, 'SEC-02 delete 0 baris';

  -- SEC-03: fungsi hanya menghitung data usaha sendiri
  assert (select count(*) from kebutuhan_bahan(current_date, current_date)) = 0, 'SEC-03 kebutuhan';
  assert (select count(*) from rekap_produksi(current_date, current_date)) = 0, 'SEC-03 rekap';

  -- SEC-04: insert dengan usaha_id usaha lain ditolak RLS
  begin
    insert into bahan(usaha_id, nama, satuan, harga_per_satuan)
    values ('00000000-0000-0000-0000-000000000000', 'Curang', 'g', 1);
    raise exception 'seharusnya gagal: usaha_id lain';
  exception when insufficient_privilege or foreign_key_violation then null; end;

  -- Tenant-safe FK: item B tidak bisa menempel ke pesanan usaha A
  insert into menu(nama, harga_jual) values ('Menu B', 10000);
  begin
    insert into item_pesanan(pesanan_id, menu_id, jumlah)
    values (a_pesanan, (select id from menu limit 1), 1);
    raise exception 'seharusnya gagal: FK lintas usaha';
  exception when foreign_key_violation then null; end;
end $$;

-- ===================== Tamu (anon) =====================
reset role;
set local role anon;
do $$
begin
  -- SEC-05: tamu tidak boleh membaca data
  begin perform count(*) from pesanan; raise exception 'seharusnya gagal: anon baca';
  exception when insufficient_privilege then null; end;
  begin perform buat_usaha('Tamu'); raise exception 'seharusnya gagal: anon buat usaha';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
do $$ begin raise notice 'SEMUA UJI LULUS'; end $$;
rollback;
