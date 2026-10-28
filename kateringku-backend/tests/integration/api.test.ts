import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { MemoryRepository } from '../../src/repositories/memoryRepo.js';
import { setRepository } from '../../src/repositories/index.js';

describe('Integration Tests: KateringKu Backend End-to-End API Flow', () => {
  let app: any;
  let tokenA: string;
  let usahaAId: string;
  let tokenB: string;
  let usahaBId: string;

  beforeEach(async () => {
    // Reset in-memory repository sebelum setiap test
    const repo = new MemoryRepository();
    setRepository(repo);
    app = createApp();

    // Setup Pengguna A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'cateringA@test.id',
        password: 'password123',
        nama_usaha: 'Catering A',
      });
    expect(resA.status).toBe(201);
    tokenA = resA.body.data.token;
    usahaAId = resA.body.data.usaha.id;

    // Setup Pengguna B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'cateringB@test.id',
        password: 'password123',
        nama_usaha: 'Catering B',
      });
    expect(resB.status).toBe(201);
    tokenB = resB.body.data.token;
    usahaBId = resB.body.data.usaha.id;
  });

  describe('US-01: Autentikasi & Akun', () => {
    it('TC-02: Menolak pendaftaran dengan email yang sama', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'cateringA@test.id',
          password: 'password456',
          nama_usaha: 'Catering Lain',
        });
      expect(res.status).toBe(400);
      expect(res.body.sukses).toBe(false);
      expect(res.body.pesan).toContain('sudah terdaftar');
    });

    it('TC-03: Menolak login jika password salah', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'cateringA@test.id',
          password: 'wrongpassword',
        });
      expect(res.status).toBe(401);
      expect(res.body.sukses).toBe(false);
    });

    it('TC-04 / SEC-05: Menolak akses ke rute terlindungi tanpa token', async () => {
      const res = await request(app).get('/api/pesanan');
      expect(res.status).toBe(401);
      expect(res.body.sukses).toBe(false);
    });

    it('SEC-06: Menolak pembuatan usaha ganda untuk satu pengguna', async () => {
      const res = await request(app)
        .post('/api/auth/usaha')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ nama: 'Usaha Kedua' });
      expect(res.status).toBe(400);
      expect(res.body.pesan).toContain('sudah punya usaha');
    });
  });

  describe('Onboarding & Seed Data (T-28)', () => {
    it('Mengisi 6 bahan contoh, 3 menu, dan resep secara otomatis', async () => {
      const seedRes = await request(app)
        .post('/api/onboarding/seed')
        .set('Authorization', `Bearer ${tokenA}`)
        .send();
      expect(seedRes.status).toBe(201);

      // Cek bahan
      const bahanRes = await request(app)
        .get('/api/bahan')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(bahanRes.body.data.length).toBe(6);

      // Cek menu
      const menuRes = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(menuRes.body.data.length).toBe(3);

      // TC-21: Cek HPP Nasi Box Ayam Goreng harus 8050
      const ayam = menuRes.body.data.find((m: any) => m.nama === 'Nasi Box Ayam Goreng');
      expect(ayam).toBeDefined();
      expect(ayam.hpp).toBe(8050);
      expect(ayam.laba_kotor).toBe(16950);
      expect(ayam.margin_persen).toBe(67.8);
    });
  });

  describe('US-02 & US-03: Bahan, Menu, dan Resep', () => {
    it('TC-05 & TC-07: Menambah bahan dan menolak nama bahan ganda', async () => {
      const b1 = await request(app)
        .post('/api/bahan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ nama: 'Kecap Manis', satuan: 'ml', harga_per_satuan: 25 });
      expect(b1.status).toBe(201);
      expect(b1.body.data.nama).toBe('Kecap Manis');

      // Coba tambah lagi dengan nama sama
      const b2 = await request(app)
        .post('/api/bahan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ nama: 'Kecap Manis', satuan: 'ml', harga_per_satuan: 30 });
      expect(b2.status).toBe(400);
      expect(b2.body.pesan).toContain('sudah ada');
    });

    it('TC-10: Menolak penghapusan bahan yang sedang dipakai dalam resep', async () => {
      // Seed data dulu
      await request(app)
        .post('/api/onboarding/seed')
        .set('Authorization', `Bearer ${tokenA}`);

      const bahanRes = await request(app)
        .get('/api/bahan')
        .set('Authorization', `Bearer ${tokenA}`);
      const ayamBahan = bahanRes.body.data.find((b: any) => b.nama === 'Ayam');

      const delRes = await request(app)
        .delete(`/api/bahan/${ayamBahan.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(delRes.status).toBe(400);
      expect(delRes.body.pesan).toContain('masih digunakan dalam resep');
    });

    it('TC-22: Mengubah harga bahan memperbarui HPP menu secara real-time', async () => {
      await request(app)
        .post('/api/onboarding/seed')
        .set('Authorization', `Bearer ${tokenA}`);

      const bahanRes = await request(app)
        .get('/api/bahan')
        .set('Authorization', `Bearer ${tokenA}`);
      const beras = bahanRes.body.data.find((b: any) => b.nama === 'Beras');

      // Naikkan harga beras dari 14 ke 20
      await request(app)
        .put(`/api/bahan/${beras.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ harga_per_satuan: 20 });

      // Cek HPP menu ayam
      const menuRes = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${tokenA}`);
      const ayam = menuRes.body.data.find((m: any) => m.nama === 'Nasi Box Ayam Goreng');

      // Kenaikan: 150g * (20 - 14) = +900 -> 8050 + 900 = 8950
      expect(ayam.hpp).toBe(8950);
    });

    it('TC-23: Daftar menu menyertakan resep lengkap agar tidak hilang setelah halaman dimuat ulang', async () => {
      await request(app)
        .post('/api/onboarding/seed')
        .set('Authorization', `Bearer ${tokenA}`);

      const menuRes = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(menuRes.status).toBe(200);

      const ayam = menuRes.body.data.find((m: any) => m.nama === 'Nasi Box Ayam Goreng');
      expect(Array.isArray(ayam.resep)).toBe(true);
      expect(ayam.resep.length).toBeGreaterThan(0);

      // Tiap baris resep memuat data yang langsung dipakai tampilan (bahan + takaran)
      const baris = ayam.resep[0];
      expect(baris.bahan_id).toBeTruthy();
      expect(baris.bahan_nama).toBeTruthy();
      expect(typeof baris.takaran).toBe('number');
      expect(baris.takaran).toBeGreaterThan(0);

      // Isi resep pada daftar harus sama dengan detail menu
      const detail = await request(app)
        .get(`/api/menu/${ayam.id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(detail.body.data.resep.length).toBe(ayam.resep.length);

      const petaTakaran = (daftar: Array<{ bahan_id: string; takaran: number }>) =>
        daftar.reduce<Record<string, number>>((acc, r) => {
          acc[r.bahan_id] = r.takaran;
          return acc;
        }, {});
      expect(petaTakaran(ayam.resep)).toEqual(petaTakaran(detail.body.data.resep));
    });
  });

  describe('US-04: Pesanan Atomik, Validasi, dan Snapshot', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/onboarding/seed')
        .set('Authorization', `Bearer ${tokenA}`);
    });

    it('TC-11: Membuat pesanan valid dengan item atomik dan snapshot harga', async () => {
      const menuRes = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${tokenA}`);
      const mAyam = menuRes.body.data.find((m: any) => m.nama === 'Nasi Box Ayam Goreng');
      const mTelur = menuRes.body.data.find((m: any) => m.nama === 'Nasi Box Telur Balado');

      const today = new Date().toISOString().split('T')[0];
      const pRes = await request(app)
        .post('/api/pesanan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          nama_pelanggan: 'Kantor Sari',
          tanggal_kirim: today,
          dp: 500000,
          items: [
            { menu_id: mAyam.id, jumlah: 40 },
            { menu_id: mTelur.id, jumlah: 10 },
          ],
        });

      expect(pRes.status).toBe(201);
      const data = pRes.body.data;
      expect(data.nama_pelanggan).toBe('Kantor Sari');
      expect(data.items.length).toBe(2);
      // Total: 40 * 25.000 + 10 * 20.000 = 1.000.000 + 200.000 = 1.200.000
      expect(data.total_harga).toBe(1200000);
      expect(data.sisa_bayar).toBe(700000);
      expect(data.items[0].harga_jual_snapshot).toBe(25000);
      expect(data.items[0].hpp_snapshot).toBe(8050);
    });

    it('TC-13: Menolak pembuatan pesanan jika DP melebihi total pesanan', async () => {
      const menuRes = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${tokenA}`);
      const mAyam = menuRes.body.data[0];

      const res = await request(app)
        .post('/api/pesanan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          nama_pelanggan: 'Pelanggan DP Berlebih',
          tanggal_kirim: '2026-10-07',
          dp: 999999999,
          items: [{ menu_id: mAyam.id, jumlah: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.pesan).toContain('DP melebihi total pesanan');
    });

    it('TC-23: Snapshot historis item pesanan tidak berubah saat harga bahan/menu di kemudian hari berubah', async () => {
      const menuRes = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${tokenA}`);
      const mAyam = menuRes.body.data.find((m: any) => m.nama === 'Nasi Box Ayam Goreng');

      const today = new Date().toISOString().split('T')[0];
      const pRes = await request(app)
        .post('/api/pesanan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          nama_pelanggan: 'Pelanggan Historis',
          tanggal_kirim: today,
          dp: 0,
          items: [{ menu_id: mAyam.id, jumlah: 5 }],
        });
      const orderId = pRes.body.data.id;

      // Ubah harga bahan Beras
      const bahanRes = await request(app)
        .get('/api/bahan')
        .set('Authorization', `Bearer ${tokenA}`);
      const beras = bahanRes.body.data.find((b: any) => b.nama === 'Beras');
      await request(app)
        .put(`/api/bahan/${beras.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ harga_per_satuan: 999 });

      // Ambil kembali pesanan lama
      const checkOrder = await request(app)
        .get(`/api/pesanan/${orderId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(checkOrder.body.data.items[0].hpp_snapshot).toBe(8050);
    });

    it('TC-24: Memajukan status pesanan secara bertahap (baru -> diproses -> terkirim -> lunas)', async () => {
      const menuRes = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${tokenA}`);
      const mAyam = menuRes.body.data[0];

      const pRes = await request(app)
        .post('/api/pesanan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          nama_pelanggan: 'Alur Status',
          tanggal_kirim: '2026-10-10',
          items: [{ menu_id: mAyam.id, jumlah: 2 }],
        });
      const id = pRes.body.data.id;
      expect(pRes.body.data.status).toBe('baru');

      const s1 = await request(app)
        .post(`/api/pesanan/${id}/advance-status`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(s1.body.data.status).toBe('diproses');

      const s2 = await request(app)
        .post(`/api/pesanan/${id}/advance-status`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(s2.body.data.status).toBe('terkirim');

      const s3 = await request(app)
        .post(`/api/pesanan/${id}/advance-status`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(s3.body.data.status).toBe('lunas');
    });

    it('TC-30: Mengubah pesanan tersimpan (item, tanggal, catatan, DP) — snapshot lama tetap dipakai', async () => {
      const menuRes = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${tokenA}`);
      const mAyam = menuRes.body.data.find((m: any) => m.nama === 'Nasi Box Ayam Goreng');
      const mTelur = menuRes.body.data.find((m: any) => m.nama === 'Nasi Box Telur Balado');

      const pRes = await request(app)
        .post('/api/pesanan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          nama_pelanggan: 'Pelanggan Edit',
          tanggal_kirim: '2026-10-10',
          dp: 100000,
          items: [{ menu_id: mAyam.id, jumlah: 10 }],
        });
      expect(pRes.status).toBe(201);
      const id = pRes.body.data.id;

      // Ubah: jumlah ayam naik, tambah telur, tanggal & catatan baru, DP disesuaikan
      const putRes = await request(app)
        .put(`/api/pesanan/${id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          tanggal_kirim: '2026-10-12',
          catatan: 'Antar sebelum jam 10',
          dp: 300000,
          items: [
            { menu_id: mAyam.id, jumlah: 20 },
            { menu_id: mTelur.id, jumlah: 5 },
          ],
        });

      expect(putRes.status).toBe(200);
      const d = putRes.body.data;
      expect(d.tanggal_kirim).toBe('2026-10-12');
      expect(d.catatan).toBe('Antar sebelum jam 10');
      expect(d.items.length).toBe(2);
      // Total baru: 20 × 25.000 + 5 × 20.000 = 600.000
      expect(d.total_harga).toBe(600000);
      expect(d.sisa_bayar).toBe(300000);
      // Nama tidak dikirim → tetap (edit parsial)
      expect(d.nama_pelanggan).toBe('Pelanggan Edit');
      // Snapshot ayam tetap harga saat pesanan dibuat
      const itAyam = d.items.find((i: any) => i.menu_id === mAyam.id);
      expect(itAyam.jumlah).toBe(20);
      expect(itAyam.harga_jual_snapshot).toBe(25000);
      expect(itAyam.hpp_snapshot).toBe(8050);
    });

    it('TC-31: Menu baru saat edit memakai harga saat ini; menu lama tetap snapshot lama meski harga berubah', async () => {
      const menuRes = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${tokenA}`);
      const mAyam = menuRes.body.data.find((m: any) => m.nama === 'Nasi Box Ayam Goreng');
      const mTelur = menuRes.body.data.find((m: any) => m.nama === 'Nasi Box Telur Balado');

      const pRes = await request(app)
        .post('/api/pesanan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          nama_pelanggan: 'Pelanggan Snapshot Edit',
          tanggal_kirim: '2026-10-10',
          items: [{ menu_id: mAyam.id, jumlah: 5 }],
        });
      const id = pRes.body.data.id;

      // Harga jual ayam naik setelah pesanan dibuat
      await request(app)
        .put(`/api/menu/${mAyam.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ harga_jual: 30000 });

      // Edit pesanan: ayam tetap (jumlah naik) + tambah telur
      const putRes = await request(app)
        .put(`/api/pesanan/${id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          items: [
            { menu_id: mAyam.id, jumlah: 8 },
            { menu_id: mTelur.id, jumlah: 2 },
          ],
        });

      expect(putRes.status).toBe(200);
      const d = putRes.body.data;
      const itAyam = d.items.find((i: any) => i.menu_id === mAyam.id);
      const itTelur = d.items.find((i: any) => i.menu_id === mTelur.id);
      // Ayam: snapshot lama 25.000 yang dipakai (bukan 30.000)
      expect(itAyam.harga_jual_snapshot).toBe(25000);
      // Telur: menu baru → harga saat ini 20.000
      expect(itTelur.harga_jual_snapshot).toBe(20000);
      // Total memakai snapshot masing-masing: 8 × 25.000 + 2 × 20.000 = 240.000
      expect(d.total_harga).toBe(240000);
    });

    it('TC-32: Edit parsial mengirim hanya catatan — item, DP, dan tanggal tidak berubah', async () => {
      const menuRes = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${tokenA}`);
      const mAyam = menuRes.body.data[0];

      const pRes = await request(app)
        .post('/api/pesanan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          nama_pelanggan: 'Pelanggan Parsial',
          tanggal_kirim: '2026-10-15',
          dp: 50000,
          items: [{ menu_id: mAyam.id, jumlah: 3 }],
        });
      const id = pRes.body.data.id;

      const putRes = await request(app)
        .put(`/api/pesanan/${id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ catatan: 'Tambahan sambal' });

      expect(putRes.status).toBe(200);
      const d = putRes.body.data;
      expect(d.catatan).toBe('Tambahan sambal');
      expect(d.tanggal_kirim).toBe('2026-10-15');
      expect(d.dp).toBe(50000);
      expect(d.items.length).toBe(1);
      expect(d.items[0].jumlah).toBe(3);
    });

    it('TC-33: Menolak edit dengan items kosong, tanggal salah format, atau DP negatif', async () => {
      const menuRes = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${tokenA}`);
      const mAyam = menuRes.body.data[0];

      const pRes = await request(app)
        .post('/api/pesanan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          nama_pelanggan: 'Pelanggan Validasi Edit',
          tanggal_kirim: '2026-10-10',
          items: [{ menu_id: mAyam.id, jumlah: 2 }],
        });
      const id = pRes.body.data.id;

      const rItems = await request(app)
        .put(`/api/pesanan/${id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ items: [] });
      expect(rItems.status).toBe(400);
      expect(rItems.body.pesan).toContain('minimal satu menu');

      const rTanggal = await request(app)
        .put(`/api/pesanan/${id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ tanggal_kirim: '12-10-2026' });
      expect(rTanggal.status).toBe(400);
      expect(rTanggal.body.pesan).toContain('tanggal kirim');

      const rDp = await request(app)
        .put(`/api/pesanan/${id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ dp: -1000 });
      expect(rDp.status).toBe(400);
      expect(rDp.body.pesan).toContain('negatif');

      // DP melebihi total baru (total = 2 × 25.000 = 50.000)
      const rDpBesar = await request(app)
        .put(`/api/pesanan/${id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ dp: 999999 });
      expect(rDpBesar.status).toBe(400);
      expect(rDpBesar.body.pesan).toContain('DP melebihi total pesanan');
    });
  });

  describe('US-05, US-06, US-10: Produksi, Belanja, & Dashboard', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/onboarding/seed')
        .set('Authorization', `Bearer ${tokenA}`);

      const menuRes = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${tokenA}`);
      const mAyam = menuRes.body.data.find((m: any) => m.nama === 'Nasi Box Ayam Goreng');
      const mTelur = menuRes.body.data.find((m: any) => m.nama === 'Nasi Box Telur Balado');

      const today = new Date().toISOString().split('T')[0];
      await request(app)
        .post('/api/pesanan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          nama_pelanggan: 'Kantor Sari',
          tanggal_kirim: today,
          dp: 100000,
          items: [
            { menu_id: mAyam.id, jumlah: 40 },
            { menu_id: mTelur.id, jumlah: 10 },
          ],
        });
    });

    it('TC-15: Rekap produksi menghitung total porsi per menu dengan benar', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .get(`/api/produksi?mulai=${today}&akhir=${today}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const rekap = res.body.data.rekap;
      const ayam = rekap.find((r: any) => r.nama === 'Nasi Box Ayam Goreng');
      expect(ayam.total_porsi).toBe(40);

      const telur = rekap.find((r: any) => r.nama === 'Nasi Box Telur Balado');
      expect(telur.total_porsi).toBe(10);
    });

    it('TC-16: Pesanan batal tidak masuk ke dalam rekap produksi', async () => {
      const menuRes = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${tokenA}`);
      const mAyam = menuRes.body.data[0];

      const tomorrow = '2026-10-25';
      const ord = await request(app)
        .post('/api/pesanan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          nama_pelanggan: 'Pesanan Batal',
          tanggal_kirim: tomorrow,
          items: [{ menu_id: mAyam.id, jumlah: 50 }],
        });

      // Batalkan pesanan
      await request(app)
        .post(`/api/pesanan/${ord.body.data.id}/batal`)
        .set('Authorization', `Bearer ${tokenA}`);

      const res = await request(app)
        .get(`/api/produksi?mulai=${tomorrow}&akhir=${tomorrow}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.body.data.total_seluruh_porsi).toBe(0);
    });

    it('TC-18: Menggabungkan kebutuhan bahan dari beberapa menu yang berbeda (Beras digabung)', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .get(`/api/belanja?mulai=${today}&akhir=${today}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const beras = res.body.data.kebutuhan.find((k: any) => k.nama === 'Beras');
      // 40 porsi ayam @150g = 6000g; 10 porsi telur @150g = 1500g -> total 7500g -> 7,5 kg
      expect(beras).toBeDefined();
      expect(beras.total_dasar).toBe(7500);
      expect(beras.tampilan_ramah).toBe('7,5 kg');
      expect(res.body.data.teks_whatsapp).toContain('DAFTAR BELANJA');
    });

    it('TC-26: Dashboard ringkasan beranda menampilkan metrik secara tepat', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .get(`/api/dashboard?tanggal=${today}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const d = res.body.data;
      expect(d.pesanan_hari_ini).toBe(1);
      expect(d.porsi_hari_ini).toBe(50);
      expect(d.omzet_bulan_ini).toBe(1200000);
    });
  });

  describe('SEC-01..SEC-04: Isolasi Data Antar Usaha (Multi-Tenant)', () => {
    beforeEach(async () => {
      // Usaha A isi data
      await request(app)
        .post('/api/onboarding/seed')
        .set('Authorization', `Bearer ${tokenA}`);
    });

    it('SEC-01: Pengguna B tidak dapat melihat bahan atau menu Usaha A', async () => {
      const bahanB = await request(app)
        .get('/api/bahan')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(bahanB.body.data.length).toBe(0);

      const menuB = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(menuB.body.data.length).toBe(0);
    });

    it('SEC-02: Pengguna B tidak dapat mengubah data Usaha A melalui ID', async () => {
      const bahanA = await request(app)
        .get('/api/bahan')
        .set('Authorization', `Bearer ${tokenA}`);
      const firstBahanId = bahanA.body.data[0].id;

      // Pengguna B mencoba mengedit bahan milik A
      const editRes = await request(app)
        .put(`/api/bahan/${firstBahanId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ nama: 'Diretas' });

      expect(editRes.status).toBe(404); // Tidak ditemukan di bawah tenant B
    });

    it('SEC-07: Pengguna B tidak dapat mengubah pesanan milik Usaha A', async () => {
      const menuRes = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${tokenA}`);
      const mAyam = menuRes.body.data[0];

      const ord = await request(app)
        .post('/api/pesanan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          nama_pelanggan: 'Pelanggan Milik A',
          tanggal_kirim: '2026-10-20',
          items: [{ menu_id: mAyam.id, jumlah: 5 }],
        });
      const idA = ord.body.data.id;

      const putB = await request(app)
        .put(`/api/pesanan/${idA}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ catatan: 'Diretas' });
      expect(putB.status).toBe(404);

      // Pastikan pesanan A tidak berubah
      const cekA = await request(app)
        .get(`/api/pesanan/${idA}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(cekA.body.data.catatan).toBe(null);
      expect(cekA.body.data.items[0].jumlah).toBe(5);
    });
  });

  describe('Cadangan & Pemulihan Data (ekspor/impor)', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/onboarding/seed')
        .set('Authorization', `Bearer ${tokenA}`);
    });

    async function isiContohPadaUsahaA() {
      const pel = await request(app)
        .post('/api/pelanggan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ nama: 'Bu Cadangan', kontak: '0812000000' });
      const menuRes = await request(app)
        .get('/api/menu')
        .set('Authorization', `Bearer ${tokenA}`);
      const mAyam = menuRes.body.data.find((m: any) => m.nama === 'Nasi Box Ayam Goreng');
      await request(app)
        .post('/api/pesanan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          nama_pelanggan: 'Bu Cadangan',
          pelanggan_id: pel.body.data.id,
          tanggal_kirim: '2026-10-20',
          dp: 50000,
          items: [{ menu_id: mAyam.id, jumlah: 5 }],
        });
    }

    it('C-01: Ekspor memuat seluruh data usaha beserta resep dan snapshot pesanan', async () => {
      await isiContohPadaUsahaA();

      const res = await request(app)
        .get('/api/cadangan')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const c = res.body.data;
      expect(c.versi).toBe(1);
      expect(c.diekspor_pada).toBeTruthy();
      expect(c.usaha.nama).toBe('Catering A');
      expect(c.bahan.length).toBe(6);
      expect(c.menu.length).toBe(3);
      expect(c.resep.length).toBeGreaterThan(0);
      expect(c.pelanggan.length).toBe(1);
      expect(c.pesanan.length).toBe(1);
      // Snapshot harga ikut terbawa (5 × 25.000 = 125.000)
      expect(c.pesanan[0].total_harga).toBe(125000);
      expect(c.pesanan[0].items[0].harga_jual_snapshot).toBe(25000);
      expect(c.pesanan[0].items[0].hpp_snapshot).toBe(8050);
    });

    it('C-02: Impor memulihkan cadangan ke usaha lain — data lama tergantikan, snapshot terjaga, nama usaha ikut', async () => {
      await isiContohPadaUsahaA();

      // Usaha baru C dengan data sementara yang nanti harus tergantikan
      const reg = await request(app)
        .post('/api/auth/register')
        .send({ email: 'cadanganC@test.id', password: 'password123', nama_usaha: 'Catering C Sementara' });
      expect(reg.status).toBe(201);
      const tokenC = reg.body.data.token;
      await request(app)
        .post('/api/bahan')
        .set('Authorization', `Bearer ${tokenC}`)
        .send({ nama: 'Garam Sementara', satuan: 'g', harga_per_satuan: 100 });
      await request(app)
        .post('/api/pelanggan')
        .set('Authorization', `Bearer ${tokenC}`)
        .send({ nama: 'Pelanggan Sementara' });

      // Ekspor dari A, impor ke C
      const ekspor = await request(app)
        .get('/api/cadangan')
        .set('Authorization', `Bearer ${tokenA}`);
      const cadangan = ekspor.body.data;

      const impor = await request(app)
        .post('/api/cadangan')
        .set('Authorization', `Bearer ${tokenC}`)
        .send(cadangan);
      expect(impor.status).toBe(200);
      expect(impor.body.data).toEqual({
        bahan: 6,
        menu: 3,
        resep: cadangan.resep.length,
        pelanggan: 1,
        pesanan: 1,
      });

      // Data lama di C hilang, data cadangan masuk utuh
      const bahanC = await request(app)
        .get('/api/bahan')
        .set('Authorization', `Bearer ${tokenC}`);
      expect(bahanC.body.data.length).toBe(6);
      expect(bahanC.body.data.find((b: any) => b.nama === 'Garam Sementara')).toBeUndefined();

      const pelangganC = await request(app)
        .get('/api/pelanggan')
        .set('Authorization', `Bearer ${tokenC}`);
      expect(pelangganC.body.data.length).toBe(1);
      expect(pelangganC.body.data[0].nama).toBe('Bu Cadangan');

      const pesananC = await request(app)
        .get('/api/pesanan')
        .set('Authorization', `Bearer ${tokenC}`);
      expect(pesananC.body.data.length).toBe(1);
      expect(pesananC.body.data[0].dp).toBe(50000);
      expect(pesananC.body.data[0].total_harga).toBe(125000);
      expect(pesananC.body.data[0].items[0].harga_jual_snapshot).toBe(25000);

      // Nama usaha ikut dipulihkan dari cadangan
      const loginC = await request(app)
        .post('/api/auth/login')
        .send({ email: 'cadanganC@test.id', password: 'password123' });
      expect(loginC.body.data.usaha.nama).toBe('Catering A');
    });

    it('C-03: Impor menolak cadangan dengan rujukan tidak utuh atau ID ganda', async () => {
      await isiContohPadaUsahaA();
      const ekspor = await request(app)
        .get('/api/cadangan')
        .set('Authorization', `Bearer ${tokenA}`);
      const cadangan = ekspor.body.data;

      // Bahan dihapus dari berkas → resep & item pesanan jadi menggantung
      const rusak = { ...cadangan, bahan: cadangan.bahan.slice(1) };
      const r1 = await request(app)
        .post('/api/cadangan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(rusak);
      expect(r1.status).toBe(400);
      expect(r1.body.pesan).toContain('tidak ada di dalam cadangan');

      // ID bahan ganda
      const ganda = {
        ...cadangan,
        bahan: [cadangan.bahan[0], { ...cadangan.bahan[0] }, ...cadangan.bahan.slice(1)],
      };
      const r2 = await request(app)
        .post('/api/cadangan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(ganda);
      expect(r2.status).toBe(400);
      expect(r2.body.pesan).toContain('ganda');
    });

    it('C-04: Impor menolak berkas yang bukan cadangan valid (versi hilang / tanggal salah)', async () => {
      const r1 = await request(app)
        .post('/api/cadangan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});
      expect(r1.status).toBe(400);
      expect(r1.body.pesan).toContain('Versi');

      const r2 = await request(app)
        .post('/api/cadangan')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          versi: 1,
          pesanan: [
            {
              id: '22222222-2222-4222-8222-222222222222',
              nama_pelanggan: 'Salah Format',
              tanggal_kirim: '20-10-2026',
              status: 'baru',
              dp: 0,
              items: [
                {
                  menu_id: '33333333-3333-4333-8333-333333333333',
                  jumlah: 1,
                  harga_jual_snapshot: 1000,
                  hpp_snapshot: 500,
                },
              ],
            },
          ],
        });
      expect(r2.status).toBe(400);
      expect(r2.body.pesan).toContain('tanggal kirim');
    });

    it('SEC-08: Cadangan hanya memuat data milik usaha pemilik sesi', async () => {
      await isiContohPadaUsahaA();

      const res = await request(app)
        .get('/api/cadangan')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(200);
      expect(res.body.data.usaha.nama).toBe('Catering B');
      expect(res.body.data.bahan.length).toBe(0);
      expect(res.body.data.menu.length).toBe(0);
      expect(res.body.data.pesanan.length).toBe(0);
    });
  });
});
