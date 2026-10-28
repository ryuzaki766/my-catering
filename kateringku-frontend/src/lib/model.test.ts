/**
 * Regresi aturan bisnis: konversi satuan (Opsi B), HPP, dan daftar belanja.
 * Titik rawan bug: harga per kg harus dibagi 1000 (bukan dikali) saat disimpan
 * sebagai harga per gram — kalau salah, semua HPP & laba ikut meleset.
 */
import { describe, expect, it } from 'vitest';
import {
  fmtJumlah,
  fmtTanggalPanjang,
  hitungBelanja,
  hppPerPorsi,
  keSatuanDasar,
  konversi,
  labaPesanan,
  rp,
  satuanTampilan,
  totalPorsi,
  totalTagihan,
} from './model';
import type { Bahan, Menu, Pesanan } from './model';

const bahanBeras: Bahan = { id: 'b-beras', nama: 'Beras', satuan: 'g', harga: 38 };
const bahanMinyak: Bahan = { id: 'b-minyak', nama: 'Minyak Goreng', satuan: 'ml', harga: 5 };

const menuNasiBox: Menu = {
  id: 'm-nasi',
  nama: 'Nasi Box',
  hargaJual: 25000,
  aktif: true,
  emoji: '\u{1F371}',
  resep: [
    { bahanId: 'b-beras', takaran: 13.5 },
    { bahanId: 'b-minyak', takaran: 75 },
  ],
};
const menuTanpaResep: Menu = {
  id: 'm-puding',
  nama: 'Puding',
  hargaJual: 10000,
  aktif: true,
  emoji: '\u{1F36E}',
  resep: [],
};

const bahanMap = new Map<string, Bahan>([
  [bahanBeras.id, bahanBeras],
  [bahanMinyak.id, bahanMinyak],
]);
const menuMap = new Map<string, Menu>([
  [menuNasiBox.id, menuNasiBox],
  [menuTanpaResep.id, menuTanpaResep],
]);

const pesanan: Pesanan = {
  id: 'p-1',
  pelangganId: 'pl-1',
  namaPelanggan: 'Bu Rina',
  tanggalKirim: '2026-10-21',
  status: 'baru',
  dp: 50000,
  catatan: 'Tanpa sambal',
  dibuatPada: '2026-10-20T00:00:00.000Z',
  items: [
    { menuId: 'm-nasi', jumlah: 3, hargaJualSnapshot: 25000, hppSnapshot: 620 },
    { menuId: 'm-puding', jumlah: 2, hargaJualSnapshot: 10000, hppSnapshot: 4000 },
  ],
};

describe('konversi (g/kg & ml/l)', () => {
  it('kg → g dan g → kg', () => {
    expect(konversi(1, 'kg', 'g')).toBe(1000);
    expect(konversi(1000, 'g', 'kg')).toBe(1);
  });

  it('l → ml dan ml → l', () => {
    expect(konversi(2, 'l', 'ml')).toBe(2000);
    expect(konversi(2000, 'ml', 'l')).toBe(2);
  });

  it('satuan sama → nilai tetap', () => {
    expect(konversi(500, 'g', 'g')).toBe(500);
    expect(konversi(3, 'butir', 'butir')).toBe(3);
  });

  it('dimensi berbeda → null (tidak dikonversi)', () => {
    expect(konversi(1, 'g', 'butir')).toBeNull();
    expect(konversi(1, 'kg', 'ml')).toBeNull();
    expect(konversi(1, 'butir', 'ml')).toBeNull();
  });
});

describe('keSatuanDasar (input user → satuan dasar backend)', () => {
  it('kg → g: harga DIBAGI 1000, bukan dikali (presisi utuh)', () => {
    expect(keSatuanDasar('kg', 13555)).toEqual({ satuan: 'g', harga: 13.555 });
    expect(keSatuanDasar('kg', 13555)?.harga).toBe(13.555);
  });

  it('liter → ml: harga dibagi 1000', () => {
    expect(keSatuanDasar('l', 25000)).toEqual({ satuan: 'ml', harga: 25 });
  });

  it('sudah satuan dasar → tidak diubah', () => {
    expect(keSatuanDasar('g', 500)).toEqual({ satuan: 'g', harga: 500 });
    expect(keSatuanDasar('butir', 2000)).toEqual({ satuan: 'butir', harga: 2000 });
  });
});

describe('hppPerPorsi = SUM(takaran x harga bahan)', () => {
  it('13.5 g x Rp38 + 75 ml x Rp5 = Rp888', () => {
    expect(hppPerPorsi(menuNasiBox, bahanMap)).toBeCloseTo(888, 6);
    expect(hppPerPorsi(menuNasiBox, bahanMap)).toBe(13.5 * 38 + 75 * 5);
  });

  it('bahan tidak ada di map → resepnya dilewati', () => {
    expect(hppPerPorsi(menuNasiBox, new Map())).toBe(0);
  });

  it('menu tanpa resep → 0', () => {
    expect(hppPerPorsi(menuTanpaResep, bahanMap)).toBe(0);
  });
});

describe('hitungBelanja (kebutuhan bahan)', () => {
  it('menjumlahkan takaran x jumlah pesanan per bahan', () => {
    const hasil = hitungBelanja([pesanan], menuMap, bahanMap);
    expect(hasil.totalPorsi).toBe(5);
    // beras: 13.5 g x 3 porsi = 40.5 g → Rp1.539 (terbesar, jadi baris pertama)
    expect(hasil.baris[0].bahan.id).toBe('b-beras');
    expect(hasil.baris[0].jumlah).toBeCloseTo(40.5, 6);
    expect(hasil.baris[0].estimasiBiaya).toBeCloseTo(40.5 * 38, 6);
    // minyak: 75 ml x 3 = 225 ml → Rp1.125
    expect(hasil.baris[1].bahan.id).toBe('b-minyak');
    expect(hasil.baris[1].jumlah).toBe(225);
    expect(hasil.totalBiaya).toBeCloseTo(40.5 * 38 + 225 * 5, 6);
  });

  it('menu tanpa resep dilaporkan, tidak dihitung sebagai bahan', () => {
    const hasil = hitungBelanja([pesanan], menuMap, bahanMap);
    expect(hasil.menuTanpaResep).toEqual([{ nama: 'Puding', porsi: 2 }]);
  });

  it('pesanan batal diabaikan', () => {
    const hasil = hitungBelanja([{ ...pesanan, status: 'batal' }], menuMap, bahanMap);
    expect(hasil.totalPorsi).toBe(0);
    expect(hasil.baris).toHaveLength(0);
    expect(hasil.totalBiaya).toBe(0);
    expect(hasil.menuTanpaResep).toHaveLength(0);
  });
});

describe('ringkasan pesanan (snapshot harga)', () => {
  it('totalTagihan = SUM(jumlah x harga jual snapshot)', () => {
    expect(totalTagihan(pesanan)).toBe(3 * 25000 + 2 * 10000);
  });

  it('labaPesanan = tagihan - modal', () => {
    const modal = 3 * 620 + 2 * 4000;
    expect(labaPesanan(pesanan)).toBe(3 * 25000 + 2 * 10000 - modal);
  });

  it('totalPorsi = jumlah semua item', () => {
    expect(totalPorsi(pesanan)).toBe(5);
  });
});

describe('format', () => {
  it('rp membulatkan tanpa desimal', () => {
    expect(rp(987654)).toBe('Rp987.654');
    expect(rp(513.4)).toBe('Rp513');
    expect(rp(0)).toBe('Rp0');
  });

  it('fmtJumlah menampilkan kg/l bila besar', () => {
    expect(fmtJumlah(2000, 'g')).toBe('2 kg');
    expect(fmtJumlah(500, 'g')).toBe('500 g');
    expect(fmtJumlah(1500, 'ml')).toBe('1,5 l');
    expect(fmtJumlah(7, 'butir')).toBe('7 butir');
  });
});

describe('satuanTampilan (label satuan mengikuti bahan)', () => {
  it('g dan kg sama-sama tampil "kg"', () => {
    expect(satuanTampilan('g')).toBe('kg');
    expect(satuanTampilan('kg')).toBe('kg');
  });

  it('ml dan l sama-sama tampil "liter"', () => {
    expect(satuanTampilan('ml')).toBe('liter');
    expect(satuanTampilan('l')).toBe('liter');
  });

  it('butir tetap "butir"', () => {
    expect(satuanTampilan('butir')).toBe('butir');
  });

  it('label hanya nama satuan — angka takaran TIDAK diubah', () => {
    // Keputusan produk: resep 40 (gram) tampil "40 kg", bukan 0,04 kg.
    // Perhitungan HPP tetap memakai angka & satuan dasar apa adanya.
    const bahan: Bahan = { id: 'b-ayam', nama: 'Ayam', satuan: 'g', harga: 40 };
    const menu: Menu = {
      id: 'm-ayam',
      nama: 'Ayam Goreng',
      hargaJual: 15000,
      aktif: true,
      emoji: '🍗',
      resep: [{ bahanId: bahan.id, takaran: 40 }],
    };
    expect(satuanTampilan(bahan.satuan)).toBe('kg');
    expect(menu.resep[0].takaran).toBe(40);
    expect(hppPerPorsi(menu, new Map([[bahan.id, bahan]]))).toBe(1600);
  });
});

describe('pemilih tanggal produksi', () => {
  it('fmtTanggalPanjang menampilkan nama hari & bulan lengkap', () => {
    expect(fmtTanggalPanjang('2026-10-27')).toBe('Selasa, 27 Oktober 2026');
  });

  it('fmtTanggalPanjang aman untuk nilai kosong', () => {
    expect(fmtTanggalPanjang('')).toBe('-');
  });
});
