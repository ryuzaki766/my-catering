import { z } from 'zod';

export const satuanDasarEnum = z.enum(['g', 'ml', 'butir']);
export const statusPesananEnum = z.enum(['baru', 'diproses', 'terkirim', 'lunas', 'batal']);

// US-01: Auth & Usaha
export const daftarSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  nama_usaha: z.string().min(1, 'Nama usaha wajib diisi').trim(),
});

export const masukSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const buatUsahaSchema = z.object({
  nama: z.string().min(1, 'Nama usaha wajib diisi').trim(),
});

// Batas wajar untuk operasional UMKM katering
export const BATAS_VALIDASI = {
  MIN_JUMLAH_PORSI: 1,
  MAX_JUMLAH_PORSI: 50_000,
  MIN_HARGA: 0,
  MAX_HARGA: 1_000_000_000,
  MIN_TAKARAN: 0.01,
  MAX_TAKARAN: 10_000,
};

// US-02: Bahan
export const buatBahanSchema = z.object({
  nama: z.string().min(1, 'Nama bahan wajib diisi').trim(),
  satuan: satuanDasarEnum,
  harga_per_satuan: z.coerce
    .number({ invalid_type_error: 'Harga bahan harus berupa angka' })
    .min(BATAS_VALIDASI.MIN_HARGA, 'Harga bahan tidak boleh negatif')
    .max(BATAS_VALIDASI.MAX_HARGA, `Harga bahan maksimal Rp ${BATAS_VALIDASI.MAX_HARGA.toLocaleString('id-ID')}`),
});

export const ubahBahanSchema = buatBahanSchema.partial();

// US-03: Menu & Resep
export const buatMenuSchema = z.object({
  nama: z.string().min(1, 'Nama menu wajib diisi').trim(),
  harga_jual: z.coerce
    .number({ invalid_type_error: 'Harga jual harus berupa angka' })
    .int('Harga jual tidak boleh pecahan')
    .min(BATAS_VALIDASI.MIN_HARGA, 'Harga jual tidak boleh negatif')
    .max(BATAS_VALIDASI.MAX_HARGA, `Harga jual maksimal Rp ${BATAS_VALIDASI.MAX_HARGA.toLocaleString('id-ID')}`),
  aktif: z.boolean().optional().default(true),
});

export const ubahMenuSchema = buatMenuSchema.partial();

export const itemResepSchema = z.object({
  bahan_id: z.string().uuid('ID bahan tidak valid'),
  takaran: z.coerce
    .number({ invalid_type_error: 'Takaran harus berupa angka' })
    .min(BATAS_VALIDASI.MIN_TAKARAN, `Takaran minimal ${BATAS_VALIDASI.MIN_TAKARAN}`)
    .max(BATAS_VALIDASI.MAX_TAKARAN, `Takaran maksimal ${BATAS_VALIDASI.MAX_TAKARAN}`),
});

export const aturResepSchema = z.object({
  items: z.array(itemResepSchema),
});

// Pelanggan
export const buatPelangganSchema = z.object({
  nama: z.string().min(1, 'Nama pelanggan wajib diisi').trim(),
  kontak: z.string().optional().nullable(),
});

// US-04: Pesanan Atomik
export const itemPesananInputSchema = z.object({
  menu_id: z.string().uuid('ID menu tidak valid'),
  jumlah: z.coerce
    .number({ invalid_type_error: 'Jumlah menu harus berupa angka' })
    .int('Jumlah menu harus bilangan bulat')
    .min(BATAS_VALIDASI.MIN_JUMLAH_PORSI, `Jumlah menu minimal ${BATAS_VALIDASI.MIN_JUMLAH_PORSI}`)
    .max(BATAS_VALIDASI.MAX_JUMLAH_PORSI, `Jumlah menu maksimal ${BATAS_VALIDASI.MAX_JUMLAH_PORSI}`),
});

export const buatPesananSchema = z.object({
  nama_pelanggan: z.string().min(1, 'Nama pelanggan wajib diisi').trim(),
  tanggal_kirim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal kirim harus YYYY-MM-DD'),
  pelanggan_id: z.string().uuid().optional().nullable(),
  dp: z.coerce
    .number({ invalid_type_error: 'DP harus berupa angka' })
    .int('DP harus berupa bilangan bulat')
    .min(0, 'DP tidak boleh negatif')
    .max(BATAS_VALIDASI.MAX_HARGA, `DP maksimal Rp ${BATAS_VALIDASI.MAX_HARGA.toLocaleString('id-ID')}`)
    .optional()
    .default(0),
  catatan: z.string().optional().nullable(),
  items: z.array(itemPesananInputSchema).min(1, 'Isi minimal satu menu'),
});

// Semua field opsional: field yang tidak dikirim dipertahankan apa adanya
export const ubahPesananSchema = z.object({
  nama_pelanggan: z.string().min(1, 'Nama pelanggan wajib diisi').trim().optional(),
  tanggal_kirim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal kirim harus YYYY-MM-DD')
    .optional(),
  pelanggan_id: z.string().uuid().optional().nullable(),
  dp: z.coerce
    .number({ invalid_type_error: 'DP harus berupa angka' })
    .int('DP harus berupa bilangan bulat')
    .min(0, 'DP tidak boleh negatif')
    .max(BATAS_VALIDASI.MAX_HARGA, `DP maksimal Rp ${BATAS_VALIDASI.MAX_HARGA.toLocaleString('id-ID')}`)
    .optional(),
  catatan: z.string().optional().nullable(),
  items: z.array(itemPesananInputSchema).min(1, 'Isi minimal satu menu').optional(),
});

export const ubahStatusPesananSchema = z.object({
  status: statusPesananEnum,
});

export const rentangTanggalQuerySchema = z.object({
  mulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format mulai harus YYYY-MM-DD').optional(),
  akhir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format akhir harus YYYY-MM-DD').optional(),
  preset: z.enum(['hari_ini', 'besok', 'lusa', 'semua']).optional(),
});

// ===== Cadangan & Pemulihan Data =====
// Field tambahan (mis. total_harga hasil hitung) otomatis dibuang oleh zod.
// `usaha_id` di setiap baris sengaja diabaikan — impor selalu memakai usaha
// pemilik sesi, sehingga cadangan bisa dipulihkan ke akun/usaha lain.
const idUnik = z.string().uuid('ID tidak valid');

const bahanCadanganSchema = z.object({
  id: idUnik,
  nama: z.string().min(1, 'Nama bahan wajib diisi').trim(),
  satuan: satuanDasarEnum,
  harga_per_satuan: z.coerce
    .number({ invalid_type_error: 'Harga bahan harus berupa angka' })
    .min(BATAS_VALIDASI.MIN_HARGA, 'Harga bahan tidak boleh negatif'),
});

const menuCadanganSchema = z.object({
  id: idUnik,
  nama: z.string().min(1, 'Nama menu wajib diisi').trim(),
  harga_jual: z.coerce
    .number({ invalid_type_error: 'Harga jual harus berupa angka' })
    .min(BATAS_VALIDASI.MIN_HARGA, 'Harga jual tidak boleh negatif'),
  aktif: z.coerce.boolean().optional().default(true),
});

const resepCadanganSchema = z.object({
  id: idUnik,
  menu_id: idUnik,
  bahan_id: idUnik,
  takaran: z.coerce
    .number({ invalid_type_error: 'Takaran harus berupa angka' })
    .min(BATAS_VALIDASI.MIN_TAKARAN, `Takaran minimal ${BATAS_VALIDASI.MIN_TAKARAN}`),
});

const pelangganCadanganSchema = z.object({
  id: idUnik,
  nama: z.string().min(1, 'Nama pelanggan wajib diisi').trim(),
  kontak: z.string().nullable().optional(),
});

const pesananCadanganSchema = z.object({
  id: idUnik,
  pelanggan_id: idUnik.nullable().optional(),
  nama_pelanggan: z.string().min(1, 'Nama pelanggan wajib diisi').trim(),
  tanggal_kirim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal kirim harus YYYY-MM-DD'),
  status: statusPesananEnum,
  dp: z.coerce
    .number({ invalid_type_error: 'DP harus berupa angka' })
    .min(0, 'DP tidak boleh negatif'),
  catatan: z.string().nullable().optional(),
  dibuat_pada: z.string().optional(),
  items: z
    .array(
      z.object({
        id: idUnik.optional(),
        menu_id: idUnik,
        jumlah: z.coerce
          .number({ invalid_type_error: 'Jumlah menu harus berupa angka' })
          .int('Jumlah menu harus bilangan bulat')
          .min(BATAS_VALIDASI.MIN_JUMLAH_PORSI, `Jumlah menu minimal ${BATAS_VALIDASI.MIN_JUMLAH_PORSI}`),
        harga_jual_snapshot: z.coerce.number().min(0, 'Snapshot harga jual tidak boleh negatif'),
        hpp_snapshot: z.coerce.number().min(0, 'Snapshot HPP tidak boleh negatif'),
      })
    )
    .min(1, 'Tiap pesanan dalam cadangan harus punya minimal satu item'),
});

export const cadanganSchema = z.object({
  versi: z.coerce
    .number({ invalid_type_error: 'Versi cadangan harus berupa angka' })
    .int('Versi cadangan harus bilangan bulat')
    .min(1, 'Versi cadangan tidak valid'),
  diekspor_pada: z.string().optional(),
  usaha: z.object({ nama: z.string().min(1, 'Nama usaha wajib diisi').trim() }).optional(),
  bahan: z.array(bahanCadanganSchema).default([]),
  menu: z.array(menuCadanganSchema).default([]),
  resep: z.array(resepCadanganSchema).default([]),
  pelanggan: z.array(pelangganCadanganSchema).default([]),
  pesanan: z.array(pesananCadanganSchema).default([]),
});
