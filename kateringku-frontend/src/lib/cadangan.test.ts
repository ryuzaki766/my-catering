import { describe, it, expect } from 'vitest';
import { bacaCadangan, namaFileCadangan, ringkasCadangan, CADANGAN_VERSI } from './cadangan';

describe('namaFileCadangan', () => {
  it('menghasilkan nama kateringku-cadangan-TAHUN-BULAN-HARI.json', () => {
    expect(namaFileCadangan(new Date(2026, 9, 21))).toBe('kateringku-cadangan-2026-10-21.json');
  });

  it('bulan dan hari satu digit dipadulkan dua', () => {
    expect(namaFileCadangan(new Date(2026, 0, 5))).toBe('kateringku-cadangan-2026-01-05.json');
  });

  it('tanggal Desember benar (12, bukan 0)', () => {
    expect(namaFileCadangan(new Date(2025, 11, 31))).toBe('kateringku-cadangan-2025-12-31.json');
  });
});

describe('bacaCadangan', () => {
  it('menerima berkas cadangan valid', () => {
    const hasil = bacaCadangan(
      JSON.stringify({ versi: CADANGAN_VERSI, bahan: [{ id: 'x' }], pesanan: [] })
    );
    expect(hasil.versi).toBe(CADANGAN_VERSI);
    expect(hasil.bahan).toHaveLength(1);
    expect(hasil.pesanan).toHaveLength(0);
  });

  it('JSON rusak ditolak dengan pesan ramah', () => {
    expect(() => bacaCadangan('{rusak')).toThrow(/tidak bisa dibaca/);
  });

  it('bukan objek (array/teks/kosong) ditolak', () => {
    expect(() => bacaCadangan('[1,2]')).toThrow(/bukan data cadangan/);
    expect(() => bacaCadangan('null')).toThrow(/bukan data cadangan/);
    expect(() => bacaCadangan('"teks"')).toThrow(/bukan data cadangan/);
    expect(() => bacaCadangan('123')).toThrow(/bukan data cadangan/);
  });

  it('versi hilang, nol, atau bukan bilangan bulat ditolak', () => {
    expect(() => bacaCadangan('{}')).toThrow(/versi/);
    expect(() => bacaCadangan('{"versi":0}')).toThrow(/versi/);
    expect(() => bacaCadangan('{"versi":-1}')).toThrow(/versi/);
    expect(() => bacaCadangan('{"versi":"1"}')).toThrow(/versi/);
    expect(() => bacaCadangan('{"versi":1.5}')).toThrow(/versi/);
  });

  it('versi lebih baru dari aplikasi ditolak dengan saran perbaruan', () => {
    expect(() => bacaCadangan(JSON.stringify({ versi: CADANGAN_VERSI + 1 }))).toThrow(/lebih baru/);
  });

  it('bagian yang ada tetapi bukan daftar ditolak', () => {
    expect(() => bacaCadangan(JSON.stringify({ versi: 1, bahan: 'bukan-array' }))).toThrow(
      /tidak berupa daftar/
    );
    expect(() => bacaCadangan(JSON.stringify({ versi: 1, pesanan: { a: 1 } }))).toThrow(
      /tidak berupa daftar/
    );
  });

  it('bagian yang hilang diperbolehkan (divalidasi server)', () => {
    const hasil = bacaCadangan(JSON.stringify({ versi: 1 }));
    expect(hasil.versi).toBe(1);
    expect(hasil.menu).toBeUndefined();
  });
});

describe('ringkasCadangan', () => {
  it('menyusun ringkasan jumlah per jenis data', () => {
    expect(
      ringkasCadangan({
        versi: 1,
        bahan: [1, 2],
        menu: [1],
        resep: [],
        pelanggan: [1],
        pesanan: [1, 2, 3],
      })
    ).toBe('2 bahan · 1 menu · 0 resep · 1 pelanggan · 3 pesanan');
  });

  it('bagian yang hilang dihitung nol', () => {
    expect(ringkasCadangan({ versi: 1 })).toBe('0 bahan · 0 menu · 0 resep · 0 pelanggan · 0 pesanan');
  });
});
