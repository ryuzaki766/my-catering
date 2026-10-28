/**
 * Regresi untuk parser angka format Indonesia.
 * Kasus-kasus di bawah pernah salah besar sebelumnya:
 * - "13.5" sempat dibaca 135 (titik selalu dibuang) → HPP resep meleset
 * - "12.5" sempat diam-diam jadi 125 (input harga pesanan tidak ketahuan salah)
 */
import { describe, expect, it } from 'vitest';
import { formatRibuan, formatRupiah, parseAngka } from './angka';

describe('parseAngka', () => {
  const kasus: Array<[input: unknown, expected: number, catatan: string]> = [
    // --- bilangan bulat polos ---
    ['25000', 25000, 'angka polos'],
    ['0', 0, 'nol'],
    ['50001', 50001, 'batas atas pesanan'],

    // --- titik = ribuan (semua blok setelah titik berisi tepat 3 angka) ---
    ['1.500', 1500, 'ribuan'],
    ['25.000', 25000, 'ribuan'],
    ['1.234.567', 1234567, 'ribuan bertingkat'],
    ['1.000.000', 1000000, 'juta'],
    ['1.500.500', 1500500, 'ribuan dua blok'],
    ['1.500.', 1500, 'titik ribuan menggantung saat diketik'],
    ['1.500,', 1500, 'koma menggantung setelah pola ribuan'],

    // --- titik = desimal gaya barat (bukan pola ribuan) ---
    ['13.5', 13.5, 'desimal barat — jangan pernah jadi 135'],
    ['12.5', 12.5, 'desimal barat'],
    ['0.75', 0.75, 'desimal barat'],
    ['0.1', 0.1, 'desimal kecil'],
    ['1.2', 1.2, 'bukan pola ribuan'],
    ['13.500', 13500, 'tetap ribuan karena bloknya 3 angka'],

    // --- koma = desimal gaya Indonesia (koma MENANG atas titik) ---
    ['12,5', 12.5, 'koma desimal'],
    ['0,75', 0.75, 'koma desimal'],
    ['1,500', 1.5, 'koma tetap desimal walau 3 angka'],
    ['0,001', 0.001, 'desimal kecil'],
    ['1.500,5', 1500.5, 'ribuan + desimal'],
    ['1.500,50', 1500.5, 'ribuan + desimal dua digit'],
    ['12.345.678,9', 12345678.9, 'ribuan bertingkat + desimal'],
    [',5', 0.5, 'koma di awal'],

    // --- masih diketik (pemisah menggantung di akhir) ---
    ['13.', 13, 'titik menggantung'],
    ['13,', 13, 'koma menggantung'],
    ['.', NaN, 'titik saja'],
    [',', NaN, 'koma saja'],
    ['', NaN, 'kosong'],
    ['   ', NaN, 'spasi'],

    // --- ditolak, bukan dipotong diam-diam ---
    ['-500', NaN, 'negatif ditolak'],
    ['1e5', NaN, 'notasi eksponen ditolak'],
    ['12abc', NaN, 'alfanumerik ditolak'],
    ['abc', NaN, 'teks murni ditolak'],
    ['12,5,5', NaN, 'dua koma ditolak'],
    ['1.5,5', NaN, 'campur titik desimal + koma ditolak'],
    ['1.500.5', NaN, 'pola ribuan rusak ditolak'],
    ['12..5', NaN, 'titik ganda ditolak'],
    ['1.5a', NaN, 'alfanumerik di blok ribuan ditolak'],

    // --- tipe selain string ---
    [13.5, 13.5, 'number utuh dilewat apa adanya'],
    [NaN, NaN, 'number NaN'],
    [Infinity, NaN, 'number tak hingga'],
    [null, NaN, 'null'],
    [undefined, NaN, 'undefined'],
    [{}, NaN, 'objek'],
  ];

  it('meng-cover seluruh kasus aturan parse', () => {
    expect(kasus.length).toBeGreaterThanOrEqual(40);
  });

  it.each(kasus)('parseAngka(%j) → %j  [%s]', (input, expected) => {
    const hasil = parseAngka(input);
    if (Number.isNaN(expected)) {
      expect(hasil).toBeNaN();
    } else {
      expect(hasil).toBe(expected);
    }
  });
});

describe('formatRupiah', () => {
  // Pemisah "Rp 25.000" di Intl memakai NBSP (U+00A0), bukan spasi biasa.
  const bersih = (s: string) => s.replace(/\u00A0/g, ' ');

  it('membulatkan dan memakai pemisah ribuan Indonesia', () => {
    expect(bersih(formatRupiah(25000))).toBe('Rp 25.000');
    expect(bersih(formatRupiah(987654))).toBe('Rp 987.654');
    expect(bersih(formatRupiah(0))).toBe('Rp 0');
  });

  it('nilai tidak valid → Rp 0 (bukan "NaN" / "Rp undefined")', () => {
    expect(bersih(formatRupiah(NaN))).toBe('Rp 0');
    expect(bersih(formatRupiah(null))).toBe('Rp 0');
    expect(bersih(formatRupiah(undefined))).toBe('Rp 0');
    expect(bersih(formatRupiah(-1000))).toBe('Rp 0');
  });
});

describe('formatRibuan', () => {
  it('ribuan tanpa simbol mata uang', () => {
    expect(formatRibuan(25000)).toBe('25.000');
    expect(formatRibuan(0)).toBe('0');
    expect(formatRibuan(NaN)).toBe('0');
  });
});
