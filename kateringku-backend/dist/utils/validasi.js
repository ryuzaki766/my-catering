"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cadanganSchema = exports.rentangTanggalQuerySchema = exports.ubahStatusPesananSchema = exports.ubahPesananSchema = exports.buatPesananSchema = exports.itemPesananInputSchema = exports.buatPelangganSchema = exports.aturResepSchema = exports.itemResepSchema = exports.ubahMenuSchema = exports.buatMenuSchema = exports.ubahBahanSchema = exports.buatBahanSchema = exports.BATAS_VALIDASI = exports.buatUsahaSchema = exports.masukSchema = exports.daftarSchema = exports.statusPesananEnum = exports.satuanDasarEnum = void 0;
const zod_1 = require("zod");
exports.satuanDasarEnum = zod_1.z.enum(['g', 'ml', 'butir']);
exports.statusPesananEnum = zod_1.z.enum(['baru', 'diproses', 'terkirim', 'lunas', 'batal']);
// US-01: Auth & Usaha
exports.daftarSchema = zod_1.z.object({
    email: zod_1.z.string().email('Format email tidak valid'),
    password: zod_1.z.string().min(6, 'Password minimal 6 karakter'),
    nama_usaha: zod_1.z.string().min(1, 'Nama usaha wajib diisi').trim(),
});
exports.masukSchema = zod_1.z.object({
    email: zod_1.z.string().email('Format email tidak valid'),
    password: zod_1.z.string().min(1, 'Password wajib diisi'),
});
exports.buatUsahaSchema = zod_1.z.object({
    nama: zod_1.z.string().min(1, 'Nama usaha wajib diisi').trim(),
});
// Batas wajar untuk operasional UMKM katering
exports.BATAS_VALIDASI = {
    MIN_JUMLAH_PORSI: 1,
    MAX_JUMLAH_PORSI: 50_000,
    MIN_HARGA: 0,
    MAX_HARGA: 1_000_000_000,
    MIN_TAKARAN: 0.01,
    MAX_TAKARAN: 10_000,
};
// US-02: Bahan
exports.buatBahanSchema = zod_1.z.object({
    nama: zod_1.z.string().min(1, 'Nama bahan wajib diisi').trim(),
    satuan: exports.satuanDasarEnum,
    harga_per_satuan: zod_1.z.coerce
        .number({ invalid_type_error: 'Harga bahan harus berupa angka' })
        .min(exports.BATAS_VALIDASI.MIN_HARGA, 'Harga bahan tidak boleh negatif')
        .max(exports.BATAS_VALIDASI.MAX_HARGA, `Harga bahan maksimal Rp ${exports.BATAS_VALIDASI.MAX_HARGA.toLocaleString('id-ID')}`),
});
exports.ubahBahanSchema = exports.buatBahanSchema.partial();
// US-03: Menu & Resep
exports.buatMenuSchema = zod_1.z.object({
    nama: zod_1.z.string().min(1, 'Nama menu wajib diisi').trim(),
    harga_jual: zod_1.z.coerce
        .number({ invalid_type_error: 'Harga jual harus berupa angka' })
        .int('Harga jual tidak boleh pecahan')
        .min(exports.BATAS_VALIDASI.MIN_HARGA, 'Harga jual tidak boleh negatif')
        .max(exports.BATAS_VALIDASI.MAX_HARGA, `Harga jual maksimal Rp ${exports.BATAS_VALIDASI.MAX_HARGA.toLocaleString('id-ID')}`),
    aktif: zod_1.z.boolean().optional().default(true),
});
exports.ubahMenuSchema = exports.buatMenuSchema.partial();
exports.itemResepSchema = zod_1.z.object({
    bahan_id: zod_1.z.string().uuid('ID bahan tidak valid'),
    takaran: zod_1.z.coerce
        .number({ invalid_type_error: 'Takaran harus berupa angka' })
        .min(exports.BATAS_VALIDASI.MIN_TAKARAN, `Takaran minimal ${exports.BATAS_VALIDASI.MIN_TAKARAN}`)
        .max(exports.BATAS_VALIDASI.MAX_TAKARAN, `Takaran maksimal ${exports.BATAS_VALIDASI.MAX_TAKARAN}`),
});
exports.aturResepSchema = zod_1.z.object({
    items: zod_1.z.array(exports.itemResepSchema),
});
// Pelanggan
exports.buatPelangganSchema = zod_1.z.object({
    nama: zod_1.z.string().min(1, 'Nama pelanggan wajib diisi').trim(),
    kontak: zod_1.z.string().optional().nullable(),
});
// US-04: Pesanan Atomik
exports.itemPesananInputSchema = zod_1.z.object({
    menu_id: zod_1.z.string().uuid('ID menu tidak valid'),
    jumlah: zod_1.z.coerce
        .number({ invalid_type_error: 'Jumlah menu harus berupa angka' })
        .int('Jumlah menu harus bilangan bulat')
        .min(exports.BATAS_VALIDASI.MIN_JUMLAH_PORSI, `Jumlah menu minimal ${exports.BATAS_VALIDASI.MIN_JUMLAH_PORSI}`)
        .max(exports.BATAS_VALIDASI.MAX_JUMLAH_PORSI, `Jumlah menu maksimal ${exports.BATAS_VALIDASI.MAX_JUMLAH_PORSI}`),
});
exports.buatPesananSchema = zod_1.z.object({
    nama_pelanggan: zod_1.z.string().min(1, 'Nama pelanggan wajib diisi').trim(),
    tanggal_kirim: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal kirim harus YYYY-MM-DD'),
    pelanggan_id: zod_1.z.string().uuid().optional().nullable(),
    dp: zod_1.z.coerce
        .number({ invalid_type_error: 'DP harus berupa angka' })
        .int('DP harus berupa bilangan bulat')
        .min(0, 'DP tidak boleh negatif')
        .max(exports.BATAS_VALIDASI.MAX_HARGA, `DP maksimal Rp ${exports.BATAS_VALIDASI.MAX_HARGA.toLocaleString('id-ID')}`)
        .optional()
        .default(0),
    catatan: zod_1.z.string().optional().nullable(),
    items: zod_1.z.array(exports.itemPesananInputSchema).min(1, 'Isi minimal satu menu'),
});
// Semua field opsional: field yang tidak dikirim dipertahankan apa adanya
exports.ubahPesananSchema = zod_1.z.object({
    nama_pelanggan: zod_1.z.string().min(1, 'Nama pelanggan wajib diisi').trim().optional(),
    tanggal_kirim: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal kirim harus YYYY-MM-DD')
        .optional(),
    pelanggan_id: zod_1.z.string().uuid().optional().nullable(),
    dp: zod_1.z.coerce
        .number({ invalid_type_error: 'DP harus berupa angka' })
        .int('DP harus berupa bilangan bulat')
        .min(0, 'DP tidak boleh negatif')
        .max(exports.BATAS_VALIDASI.MAX_HARGA, `DP maksimal Rp ${exports.BATAS_VALIDASI.MAX_HARGA.toLocaleString('id-ID')}`)
        .optional(),
    catatan: zod_1.z.string().optional().nullable(),
    items: zod_1.z.array(exports.itemPesananInputSchema).min(1, 'Isi minimal satu menu').optional(),
});
exports.ubahStatusPesananSchema = zod_1.z.object({
    status: exports.statusPesananEnum,
});
exports.rentangTanggalQuerySchema = zod_1.z.object({
    mulai: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format mulai harus YYYY-MM-DD').optional(),
    akhir: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format akhir harus YYYY-MM-DD').optional(),
    preset: zod_1.z.enum(['hari_ini', 'besok', 'lusa', 'semua']).optional(),
});
// ===== Cadangan & Pemulihan Data =====
// Field tambahan (mis. total_harga hasil hitung) otomatis dibuang oleh zod.
// `usaha_id` di setiap baris sengaja diabaikan — impor selalu memakai usaha
// pemilik sesi, sehingga cadangan bisa dipulihkan ke akun/usaha lain.
const idUnik = zod_1.z.string().uuid('ID tidak valid');
const bahanCadanganSchema = zod_1.z.object({
    id: idUnik,
    nama: zod_1.z.string().min(1, 'Nama bahan wajib diisi').trim(),
    satuan: exports.satuanDasarEnum,
    harga_per_satuan: zod_1.z.coerce
        .number({ invalid_type_error: 'Harga bahan harus berupa angka' })
        .min(exports.BATAS_VALIDASI.MIN_HARGA, 'Harga bahan tidak boleh negatif'),
});
const menuCadanganSchema = zod_1.z.object({
    id: idUnik,
    nama: zod_1.z.string().min(1, 'Nama menu wajib diisi').trim(),
    harga_jual: zod_1.z.coerce
        .number({ invalid_type_error: 'Harga jual harus berupa angka' })
        .min(exports.BATAS_VALIDASI.MIN_HARGA, 'Harga jual tidak boleh negatif'),
    aktif: zod_1.z.coerce.boolean().optional().default(true),
});
const resepCadanganSchema = zod_1.z.object({
    id: idUnik,
    menu_id: idUnik,
    bahan_id: idUnik,
    takaran: zod_1.z.coerce
        .number({ invalid_type_error: 'Takaran harus berupa angka' })
        .min(exports.BATAS_VALIDASI.MIN_TAKARAN, `Takaran minimal ${exports.BATAS_VALIDASI.MIN_TAKARAN}`),
});
const pelangganCadanganSchema = zod_1.z.object({
    id: idUnik,
    nama: zod_1.z.string().min(1, 'Nama pelanggan wajib diisi').trim(),
    kontak: zod_1.z.string().nullable().optional(),
});
const pesananCadanganSchema = zod_1.z.object({
    id: idUnik,
    pelanggan_id: idUnik.nullable().optional(),
    nama_pelanggan: zod_1.z.string().min(1, 'Nama pelanggan wajib diisi').trim(),
    tanggal_kirim: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal kirim harus YYYY-MM-DD'),
    status: exports.statusPesananEnum,
    dp: zod_1.z.coerce
        .number({ invalid_type_error: 'DP harus berupa angka' })
        .min(0, 'DP tidak boleh negatif'),
    catatan: zod_1.z.string().nullable().optional(),
    dibuat_pada: zod_1.z.string().optional(),
    items: zod_1.z
        .array(zod_1.z.object({
        id: idUnik.optional(),
        menu_id: idUnik,
        jumlah: zod_1.z.coerce
            .number({ invalid_type_error: 'Jumlah menu harus berupa angka' })
            .int('Jumlah menu harus bilangan bulat')
            .min(exports.BATAS_VALIDASI.MIN_JUMLAH_PORSI, `Jumlah menu minimal ${exports.BATAS_VALIDASI.MIN_JUMLAH_PORSI}`),
        harga_jual_snapshot: zod_1.z.coerce.number().min(0, 'Snapshot harga jual tidak boleh negatif'),
        hpp_snapshot: zod_1.z.coerce.number().min(0, 'Snapshot HPP tidak boleh negatif'),
    }))
        .min(1, 'Tiap pesanan dalam cadangan harus punya minimal satu item'),
});
exports.cadanganSchema = zod_1.z.object({
    versi: zod_1.z.coerce
        .number({ invalid_type_error: 'Versi cadangan harus berupa angka' })
        .int('Versi cadangan harus bilangan bulat')
        .min(1, 'Versi cadangan tidak valid'),
    diekspor_pada: zod_1.z.string().optional(),
    usaha: zod_1.z.object({ nama: zod_1.z.string().min(1, 'Nama usaha wajib diisi').trim() }).optional(),
    bahan: zod_1.z.array(bahanCadanganSchema).default([]),
    menu: zod_1.z.array(menuCadanganSchema).default([]),
    resep: zod_1.z.array(resepCadanganSchema).default([]),
    pelanggan: zod_1.z.array(pelangganCadanganSchema).default([]),
    pesanan: zod_1.z.array(pesananCadanganSchema).default([]),
});
//# sourceMappingURL=validasi.js.map