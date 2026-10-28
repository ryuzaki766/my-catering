import { describe, it, expect } from 'vitest';
import {
  hitungHpp,
  hitungLabaKotor,
  hitungMarginPersen,
  konversiSatuan,
} from '../../src/utils/hitung.js';

describe('Unit Tests: hitung.ts', () => {
  it('TC-21: hitungHpp menghasilkan total sesuai resep contoh', () => {
    // Nasi Box Ayam Goreng:
    // Beras 150g @ 14 = 2100
    // Ayam 120g @ 38 = 4560
    // Sayuran 60g @ 12 = 720
    // Minyak 15ml @ 18 = 270
    // Bumbu 10g @ 40 = 400
    // Total = 8050
    const resepAyam = [
      { takaran: 150, harga_per_satuan: 14 },
      { takaran: 120, harga_per_satuan: 38 },
      { takaran: 60, harga_per_satuan: 12 },
      { takaran: 15, harga_per_satuan: 18 },
      { takaran: 10, harga_per_satuan: 40 },
    ];
    const hpp = hitungHpp(resepAyam);
    expect(hpp).toBe(8050);
  });

  it('hitungLabaKotor dan hitungMarginPersen menghitung laba dan margin dengan tepat', () => {
    const hargaJual = 25000;
    const hpp = 8050;
    const laba = hitungLabaKotor(hargaJual, hpp);
    expect(laba).toBe(16950);

    const margin = hitungMarginPersen(hargaJual, hpp);
    // (16950 / 25000) * 100 = 67.8%
    expect(margin).toBe(67.8);
  });

  it('TC-19: konversiSatuan mengubah 6.000 g menjadi 6 kg', () => {
    const hasil = konversiSatuan(6000, 'g');
    expect(hasil.satuan_tampilan).toBe('kg');
    expect(hasil.total_tampilan).toBe(6);
    expect(hasil.tampilan_ramah).toBe('6 kg');
  });

  it('konversiSatuan menangani angka desimal gram ke kg dengan koma (25,5 kg)', () => {
    const hasil = konversiSatuan(25500, 'g');
    expect(hasil.satuan_tampilan).toBe('kg');
    expect(hasil.total_tampilan).toBe(25.5);
    expect(hasil.tampilan_ramah).toBe('25,5 kg');
  });

  it('konversiSatuan mengubah 2.100 ml menjadi 2,1 liter', () => {
    const hasil = konversiSatuan(2100, 'ml');
    expect(hasil.satuan_tampilan).toBe('liter');
    expect(hasil.total_tampilan).toBe(2.1);
    expect(hasil.tampilan_ramah).toBe('2,1 liter');
  });

  it('konversiSatuan mempertahankan satuan butir apa adanya', () => {
    const hasil = konversiSatuan(50, 'butir');
    expect(hasil.satuan_tampilan).toBe('butir');
    expect(hasil.total_tampilan).toBe(50);
    expect(hasil.tampilan_ramah).toBe('50 butir');
  });
});
