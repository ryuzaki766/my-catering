// ===== Cadangan & Pemulihan Data (ekspor/impor) — sisi aplikasi =====
// Helper murni di berkas ini diuji di `cadangan.test.ts`.

/** Versi skema berkas cadangan yang dipahami aplikasi ini. */
export const CADANGAN_VERSI = 1;

export interface CadanganPayload {
  versi: number;
  diekspor_pada?: string;
  usaha?: { nama: string };
  bahan?: unknown[];
  menu?: unknown[];
  resep?: unknown[];
  pelanggan?: unknown[];
  pesanan?: unknown[];
}

export interface HasilImporCadangan {
  bahan: number;
  menu: number;
  resep: number;
  pelanggan: number;
  pesanan: number;
}

/** Nama berkas cadangan, contoh: `kateringku-cadangan-2026-10-21.json`. */
export function namaFileCadangan(tanggal: Date = new Date()): string {
  const dua = (n: number) => String(n).padStart(2, '0');
  const ymd = `${tanggal.getFullYear()}-${dua(tanggal.getMonth() + 1)}-${dua(tanggal.getDate())}`;
  return `kateringku-cadangan-${ymd}.json`;
}

/**
 * Baca & periksa isi berkas cadangan sebelum dikirim ke server.
 * Melempar `Error` dengan pesan ramah bila berkas bukan cadangan yang valid;
 * validasi menyeluruh tetap dilakukan server.
 */
export function bacaCadangan(teks: string): CadanganPayload {
  let mentah: unknown;
  try {
    mentah = JSON.parse(teks);
  } catch {
    throw new Error('Berkas tidak bisa dibaca — pastikan file JSON hasil unduhan KateringKu.');
  }
  if (!mentah || typeof mentah !== 'object' || Array.isArray(mentah)) {
    throw new Error('Isi berkas bukan data cadangan yang valid.');
  }
  const c = mentah as Record<string, unknown>;
  const versi = c.versi;
  if (typeof versi !== 'number' || !Number.isInteger(versi) || versi < 1) {
    throw new Error('Berkas tidak punya nomor versi cadangan yang valid.');
  }
  if (versi > CADANGAN_VERSI) {
    throw new Error(
      `Berkas cadangan versi ${versi} dibuat oleh aplikasi yang lebih baru — perbarui aplikasi dulu.`
    );
  }
  for (const kunci of ['bahan', 'menu', 'resep', 'pelanggan', 'pesanan'] as const) {
    if (c[kunci] !== undefined && !Array.isArray(c[kunci])) {
      throw new Error(`Bagian "${kunci}" pada berkas cadangan tidak berupa daftar.`);
    }
  }
  return {
    versi,
    diekspor_pada: typeof c.diekspor_pada === 'string' ? c.diekspor_pada : undefined,
    usaha:
      c.usaha && typeof c.usaha === 'object' && typeof (c.usaha as { nama?: unknown }).nama === 'string'
        ? { nama: (c.usaha as { nama: string }).nama }
        : undefined,
    bahan: Array.isArray(c.bahan) ? c.bahan : undefined,
    menu: Array.isArray(c.menu) ? c.menu : undefined,
    resep: Array.isArray(c.resep) ? c.resep : undefined,
    pelanggan: Array.isArray(c.pelanggan) ? c.pelanggan : undefined,
    pesanan: Array.isArray(c.pesanan) ? c.pesanan : undefined,
  };
}

/** Unduh objek cadangan sebagai berkas JSON. */
export function unduhCadangan(data: CadanganPayload, nama: string = namaFileCadangan()): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nama;
  a.click();
  URL.revokeObjectURL(url);
}

/** Ringkasan isi cadangan (untuk ditampilkan sebelum pemulihan). */
export function ringkasCadangan(c: CadanganPayload): string {
  const n = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  return `${n(c.bahan)} bahan · ${n(c.menu)} menu · ${n(c.resep)} resep · ${n(c.pelanggan)} pelanggan · ${n(
    c.pesanan
  )} pesanan`;
}
