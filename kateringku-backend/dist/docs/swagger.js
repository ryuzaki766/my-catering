"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerDocument = void 0;
exports.swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'KateringKu Backend REST API',
        version: '1.0.0',
        description: `
**KateringKu** adalah aplikasi backend manajemen katering untuk UMKM.
Mencakup fungsionalitas lengkap untuk:
- **US-01**: Autentikasi Pengguna & Multi-tenant Usaha
- **US-02**: Manajemen Bahan Baku & Satuan Dasar (g, ml, butir)
- **US-03**: Manajemen Menu & Resep dengan Kalkulasi HPP Otomatis
- **US-04**: Pencatatan Pesanan Atomik & Snapshot Harga Historis
- **US-05**: Rekap Produksi Harian / Rentang Tanggal
- **US-06**: Rekap Kebutuhan Bahan (Daftar Belanja) dengan Konversi Satuan Ramah (kg, liter)
- **US-07**: Analisis HPP dan Margin Keuntungan
- **US-08**: Alur Status Pesanan (Baru -> Diproses -> Terkirim -> Lunas)
- **US-09**: Generator Format Pesan WhatsApp untuk Belanja
- **US-10**: Ringkasan Beranda / Dashboard Keuangan & Operasional
    `,
    },
    servers: [
        {
            url: '/api',
            description: 'API Server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Masukkan token JWT yang didapat dari endpoint /auth/login atau /auth/register',
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
    paths: {
        '/health': {
            get: {
                summary: 'Pengecekan Kesehatan Server',
                security: [],
                responses: {
                    200: { description: 'Server berjalan dengan normal' },
                },
            },
        },
        '/auth/register': {
            post: {
                summary: 'Pendaftaran Akun Baru + Pembuatan Usaha (US-01)',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password', 'nama_usaha'],
                                properties: {
                                    email: { type: 'string', example: 'rina@katering.id' },
                                    password: { type: 'string', example: 'rahasia123' },
                                    nama_usaha: { type: 'string', example: 'Catering Bu Rina' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Pendaftaran berhasil dan token JWT dikembalikan' },
                },
            },
        },
        '/auth/login': {
            post: {
                summary: 'Masuk Akun (US-01)',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', example: 'rina@katering.id' },
                                    password: { type: 'string', example: 'rahasia123' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Berhasil masuk' },
                },
            },
        },
        '/auth/me': {
            get: {
                summary: 'Ambil Profil Pengguna & Usaha yang Sedang Login',
                responses: {
                    200: { description: 'Data profil berhasil diambil' },
                },
            },
        },
        '/onboarding/seed': {
            post: {
                summary: 'Isi Contoh Data Onboarding (6 Bahan, 3 Menu, dan Resep)',
                description: 'Hanya bisa dijalankan jika usaha belum memiliki data bahan/menu (T-28)',
                responses: {
                    201: { description: 'Data contoh berhasil ditambahkan' },
                    400: { description: 'Data sudah ada' },
                },
            },
        },
        '/bahan': {
            get: {
                summary: 'Daftar Semua Bahan Baku (US-02)',
                responses: {
                    200: { description: 'Daftar bahan' },
                },
            },
            post: {
                summary: 'Tambah Bahan Baku Baru (US-02)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['nama', 'satuan', 'harga_per_satuan'],
                                properties: {
                                    nama: { type: 'string', example: 'Daging Sapi' },
                                    satuan: { type: 'string', enum: ['g', 'ml', 'butir'], example: 'g' },
                                    harga_per_satuan: { type: 'number', example: 120 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Bahan berhasil dibuat' },
                },
            },
        },
        '/bahan/{id}': {
            put: {
                summary: 'Ubah Data Bahan Baku (US-02)',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    nama: { type: 'string' },
                                    satuan: { type: 'string', enum: ['g', 'ml', 'butir'] },
                                    harga_per_satuan: { type: 'number' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Bahan berhasil diperbarui' },
                },
            },
            delete: {
                summary: 'Hapus Bahan Baku (Ditolak jika sedang dipakai di resep, TC-10)',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    200: { description: 'Bahan berhasil dihapus' },
                    400: { description: 'Bahan masih dipakai dalam resep' },
                },
            },
        },
        '/menu': {
            get: {
                summary: 'Daftar Semua Menu beserta HPP dan Margin Keuntungan (US-03, US-07)',
                responses: {
                    200: { description: 'Daftar menu dengan HPP terhitung' },
                },
            },
            post: {
                summary: 'Tambah Menu Baru (US-03)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['nama', 'harga_jual'],
                                properties: {
                                    nama: { type: 'string', example: 'Nasi Box Rendang' },
                                    harga_jual: { type: 'number', example: 35000 },
                                    aktif: { type: 'boolean', example: true },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Menu berhasil dibuat' },
                },
            },
        },
        '/menu/{id}': {
            get: {
                summary: 'Detail Menu beserta Resep & Rincian HPP (US-03)',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    200: { description: 'Detail menu' },
                },
            },
            put: {
                summary: 'Ubah Data Menu',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    nama: { type: 'string' },
                                    harga_jual: { type: 'number' },
                                    aktif: { type: 'boolean' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Menu berhasil diperbarui' },
                },
            },
            delete: {
                summary: 'Hapus Menu',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    200: { description: 'Menu berhasil dihapus' },
                },
            },
        },
        '/menu/{menuId}/resep': {
            get: {
                summary: 'Lihat Resep Suatu Menu (US-03)',
                parameters: [
                    { name: 'menuId', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    200: { description: 'Daftar bahan dalam resep menu' },
                },
            },
            put: {
                summary: 'Atur Komposisi Resep Menu (US-03, TC-08, TC-09)',
                parameters: [
                    { name: 'menuId', in: 'path', required: true, schema: { type: 'string' } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['items'],
                                properties: {
                                    items: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            required: ['bahan_id', 'takaran'],
                                            properties: {
                                                bahan_id: { type: 'string' },
                                                takaran: { type: 'number', example: 150 },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Resep berhasil diperbarui' },
                },
            },
        },
        '/pesanan': {
            get: {
                summary: 'Daftar Semua Pesanan (US-04)',
                parameters: [
                    { name: 'tanggal', in: 'query', schema: { type: 'string', example: '2026-10-07' } },
                    { name: 'mulai', in: 'query', schema: { type: 'string', example: '2026-10-01' } },
                    { name: 'akhir', in: 'query', schema: { type: 'string', example: '2026-10-31' } },
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['baru', 'diproses', 'terkirim', 'lunas', 'batal'] } },
                ],
                responses: {
                    200: { description: 'Daftar pesanan' },
                },
            },
            post: {
                summary: 'Buat Pesanan Baru secara Atomik dengan Snapshot Harga (US-04, TC-11..14, TC-23)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['nama_pelanggan', 'tanggal_kirim', 'items'],
                                properties: {
                                    nama_pelanggan: { type: 'string', example: 'Kantor Notaris Sari' },
                                    tanggal_kirim: { type: 'string', example: '2026-10-07' },
                                    dp: { type: 'number', example: 500000 },
                                    catatan: { type: 'string', example: 'Kirim pukul 11:30' },
                                    items: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            required: ['menu_id', 'jumlah'],
                                            properties: {
                                                menu_id: { type: 'string' },
                                                jumlah: { type: 'integer', example: 40 },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Pesanan berhasil dibuat' },
                },
            },
        },
        '/pesanan/{id}': {
            get: {
                summary: 'Detail Pesanan Lengkap dengan Item dan Perhitungan (US-04)',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    200: { description: 'Detail pesanan' },
                },
            },
            put: {
                summary: 'Ubah Pesanan Tersimpan (item, tanggal kirim, catatan, DP) — snapshot harga lama dipertahankan',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                description: 'Semua field opsional — field yang tidak dikirim dipertahankan. Item yang menu-nya sudah ada di pesanan memakai snapshot harga lama; menu baru memakai harga saat ini.',
                                properties: {
                                    nama_pelanggan: { type: 'string', example: 'Kantor Notaris Sari' },
                                    tanggal_kirim: { type: 'string', example: '2026-10-09' },
                                    pelanggan_id: { type: 'string', nullable: true },
                                    dp: { type: 'number', example: 250000 },
                                    catatan: { type: 'string', example: 'Sambal terpisah, antar sebelum jam 10' },
                                    items: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            required: ['menu_id', 'jumlah'],
                                            properties: {
                                                menu_id: { type: 'string' },
                                                jumlah: { type: 'integer', example: 50 },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Pesanan berhasil diperbarui' },
                },
            },
            delete: {
                summary: 'Hapus Pesanan',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    200: { description: 'Pesanan dihapus' },
                },
            },
        },
        '/pesanan/{id}/status': {
            patch: {
                summary: 'Ubah Status Pesanan Tertentu (US-08)',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['status'],
                                properties: {
                                    status: { type: 'string', enum: ['baru', 'diproses', 'terkirim', 'lunas', 'batal'] },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Status berhasil diperbarui' },
                },
            },
        },
        '/pesanan/{id}/advance-status': {
            post: {
                summary: 'Maju ke Status Berikutnya (Ketuk Status: baru -> diproses -> terkirim -> lunas) (TC-24)',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    200: { description: 'Status pesanan berhasil dinaikkan' },
                },
            },
        },
        '/pesanan/{id}/batal': {
            post: {
                summary: 'Batalkan Pesanan (US-08, TC-16)',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    200: { description: 'Pesanan berhasil dibatalkan' },
                },
            },
        },
        '/produksi': {
            get: {
                summary: 'Rekap Produksi Total Porsi per Menu (US-05, TC-15..17)',
                parameters: [
                    { name: 'preset', in: 'query', schema: { type: 'string', enum: ['hari_ini', 'besok', 'lusa', 'semua'] } },
                    { name: 'mulai', in: 'query', schema: { type: 'string', example: '2026-10-07' } },
                    { name: 'akhir', in: 'query', schema: { type: 'string', example: '2026-10-07' } },
                ],
                responses: {
                    200: { description: 'Total porsi yang harus dimasak per menu' },
                },
            },
        },
        '/belanja': {
            get: {
                summary: 'Daftar Belanja Kebutuhan Bahan Otomatis & Format WhatsApp (US-06, US-09, TC-18..20, TC-25)',
                parameters: [
                    { name: 'preset', in: 'query', schema: { type: 'string', enum: ['hari_ini', 'besok', 'lusa', 'semua'] } },
                    { name: 'mulai', in: 'query', schema: { type: 'string', example: '2026-10-07' } },
                    { name: 'akhir', in: 'query', schema: { type: 'string', example: '2026-10-07' } },
                ],
                responses: {
                    200: { description: 'Kebutuhan bahan, estimasi biaya, peringatan menu tanpa resep, dan teks WhatsApp' },
                },
            },
        },
        '/dashboard': {
            get: {
                summary: 'Ringkasan Beranda / Dashboard Keuangan & Operasional (US-10, TC-26)',
                parameters: [
                    { name: 'tanggal', in: 'query', schema: { type: 'string', example: '2026-10-07' } },
                ],
                responses: {
                    200: { description: 'Pesanan hari ini, porsi hari ini, omzet bulan ini, laba kotor, dan pesanan terdekat' },
                },
            },
        },
        '/cadangan': {
            get: {
                summary: 'Ekspor Cadangan Data (unduh seluruh data usaha sebagai berkas JSON)',
                responses: {
                    200: {
                        description: 'Berkas cadangan: versi, waktu ekspor, usaha, bahan, menu, resep, pelanggan, dan pesanan (item + snapshot harga)',
                    },
                },
            },
            post: {
                summary: 'Pulihkan Data dari Cadangan — MENGANTI seluruh data usaha pemilik sesi dengan isi berkas cadangan',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['versi'],
                                properties: {
                                    versi: { type: 'integer', example: 1 },
                                    diekspor_pada: { type: 'string', example: '2026-10-21T07:00:00.000Z' },
                                    usaha: {
                                        type: 'object',
                                        properties: { nama: { type: 'string', example: 'Catering Berkah Bu Rina' } },
                                    },
                                    bahan: { type: 'array', items: { type: 'object' } },
                                    menu: { type: 'array', items: { type: 'object' } },
                                    resep: { type: 'array', items: { type: 'object' } },
                                    pelanggan: { type: 'array', items: { type: 'object' } },
                                    pesanan: { type: 'array', items: { type: 'object' } },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Jumlah baris yang berhasil dipulihkan per jenis data' },
                    400: { description: 'Berkas cadangan tidak valid (struktur salah atau rujukan antar data tidak utuh)' },
                },
            },
        },
    },
};
//# sourceMappingURL=swagger.js.map