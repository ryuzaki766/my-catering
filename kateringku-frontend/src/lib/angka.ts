/**
 * Helper untuk sanitasi, parsing, dan pemformatan angka format Indonesia (IDR)
 */

/**
 * Mengubah input mentah (string/number) menjadi angka aman (number murni).
 * Menolak input kosong, negatif, notasi eksponen ("1e5"), dan alfanumerik ("12abc").
 *
 * Cara membedakan titik ribuan dengan titik desimal:
 * 1. Ada koma  → koma = desimal (gaya Indonesia), semua titik = ribuan.
 *    "1.500,5" -> 1500.5
 * 2. Tanpa koma, tapi semua blok setelah titik berisi tepat 3 angka
 *    → pola ribuan, titiknya dibuang.  "1.500" -> 1500, "1.234.567" -> 1234567
 * 3. Selain itu titik diperlakukan sebagai desimal gaya barat.
 *    "13.5" -> 13.5, "0.75" -> 0.75
 *
 * (Dulu semua titik dibuang tanpa kecuali, sehingga "13.5" jadi 135 dan
 * "0.75" resep jadi 75 — angka salah besar.)
 *
 * Contoh lain:
 * - "25000"   -> 25000
 * - "25.000"  -> 25000
 * - "13."     -> 13     (titik menggantung saat sedang mengetik)
 * - ".5"      -> 0.5
 * - "-500"    -> NaN (ditolak)
 * - "abc"     -> NaN (ditolak)
 */
export function parseAngka(raw: unknown): number {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : NaN;
  }

  if (typeof raw !== 'string') return NaN;

  // Rapikan saat masih diketik: pemisah yang menggantung di akhir ("13." /
  // "13,") dibuang dulu supaya keputusan ribuan/desimal mengikuti angka yang
  // benar-benar ada, dan input tidak berkedip invalid di tengah mengetik.
  let t = raw.trim();
  if (t.endsWith('.') || t.endsWith(',')) t = t.slice(0, -1);
  if (!t) return NaN;

  let bersih: string;
  if (t.includes(',')) {
    // Koma = desimal gaya Indonesia. Sebelum koma wajib pola ribuan ("1.500")
    // atau angka polos ("1500"), sesudah koma hanya angka — selain itu dianggap
    // salah ketik dan ditolak, bukan dipotong diam-diam.
    const [sebelum, sesudah, ...sisa] = t.split(',');
    const utuh = sebelum === '' ? '0' : sebelum; // ",5" -> "0,5"
    const polaUtuh = /^\d{1,3}(\.\d{3})*$/.test(utuh) || /^\d+$/.test(utuh);
    if (sisa.length > 0 || !polaUtuh || !/^\d+$/.test(sesudah)) return NaN;
    bersih = utuh.replace(/\./g, '') + '.' + sesudah;
  } else {
    const blok = t.split('.');
    const polaRibuan = blok.length > 1 && blok.slice(1).every((b) => b.length === 3);
    // "1.500" / "1.234.567" → ribuan; "13.5" / "0.75" → desimal gaya barat
    bersih = polaRibuan ? blok.join('') : t;
  }

  if (bersih.startsWith('.')) bersih = '0' + bersih; // ".5" -> "0.5"
  if (!/^\d+(\.\d+)?$/.test(bersih)) return NaN;

  const num = Number(bersih);
  return Number.isFinite(num) ? num : NaN;
}

/**
 * Format angka ke mata uang Rupiah standar Indonesia:
 * Contoh: 25000 -> "Rp 25.000"
 */
export function formatRupiah(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n) || n < 0) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Format angka dengan pemisah ribuan titik tanpa simbol mata uang:
 * Contoh: 25000 -> "25.000"
 */
export function formatRibuan(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(n);
}
