import { z } from 'zod';
export declare const satuanDasarEnum: z.ZodEnum<["g", "ml", "butir"]>;
export declare const statusPesananEnum: z.ZodEnum<["baru", "diproses", "terkirim", "lunas", "batal"]>;
export declare const daftarSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    nama_usaha: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    nama_usaha: string;
}, {
    email: string;
    password: string;
    nama_usaha: string;
}>;
export declare const masukSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const buatUsahaSchema: z.ZodObject<{
    nama: z.ZodString;
}, "strip", z.ZodTypeAny, {
    nama: string;
}, {
    nama: string;
}>;
export declare const BATAS_VALIDASI: {
    MIN_JUMLAH_PORSI: number;
    MAX_JUMLAH_PORSI: number;
    MIN_HARGA: number;
    MAX_HARGA: number;
    MIN_TAKARAN: number;
    MAX_TAKARAN: number;
};
export declare const buatBahanSchema: z.ZodObject<{
    nama: z.ZodString;
    satuan: z.ZodEnum<["g", "ml", "butir"]>;
    harga_per_satuan: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    nama: string;
    satuan: "g" | "ml" | "butir";
    harga_per_satuan: number;
}, {
    nama: string;
    satuan: "g" | "ml" | "butir";
    harga_per_satuan: number;
}>;
export declare const ubahBahanSchema: z.ZodObject<{
    nama: z.ZodOptional<z.ZodString>;
    satuan: z.ZodOptional<z.ZodEnum<["g", "ml", "butir"]>>;
    harga_per_satuan: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    nama?: string | undefined;
    satuan?: "g" | "ml" | "butir" | undefined;
    harga_per_satuan?: number | undefined;
}, {
    nama?: string | undefined;
    satuan?: "g" | "ml" | "butir" | undefined;
    harga_per_satuan?: number | undefined;
}>;
export declare const buatMenuSchema: z.ZodObject<{
    nama: z.ZodString;
    harga_jual: z.ZodNumber;
    aktif: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    nama: string;
    harga_jual: number;
    aktif: boolean;
}, {
    nama: string;
    harga_jual: number;
    aktif?: boolean | undefined;
}>;
export declare const ubahMenuSchema: z.ZodObject<{
    nama: z.ZodOptional<z.ZodString>;
    harga_jual: z.ZodOptional<z.ZodNumber>;
    aktif: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, "strip", z.ZodTypeAny, {
    nama?: string | undefined;
    harga_jual?: number | undefined;
    aktif?: boolean | undefined;
}, {
    nama?: string | undefined;
    harga_jual?: number | undefined;
    aktif?: boolean | undefined;
}>;
export declare const itemResepSchema: z.ZodObject<{
    bahan_id: z.ZodString;
    takaran: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    takaran: number;
    bahan_id: string;
}, {
    takaran: number;
    bahan_id: string;
}>;
export declare const aturResepSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        bahan_id: z.ZodString;
        takaran: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        takaran: number;
        bahan_id: string;
    }, {
        takaran: number;
        bahan_id: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items: {
        takaran: number;
        bahan_id: string;
    }[];
}, {
    items: {
        takaran: number;
        bahan_id: string;
    }[];
}>;
export declare const buatPelangganSchema: z.ZodObject<{
    nama: z.ZodString;
    kontak: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    nama: string;
    kontak?: string | null | undefined;
}, {
    nama: string;
    kontak?: string | null | undefined;
}>;
export declare const itemPesananInputSchema: z.ZodObject<{
    menu_id: z.ZodString;
    jumlah: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    jumlah: number;
    menu_id: string;
}, {
    jumlah: number;
    menu_id: string;
}>;
export declare const buatPesananSchema: z.ZodObject<{
    nama_pelanggan: z.ZodString;
    tanggal_kirim: z.ZodString;
    pelanggan_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dp: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    catatan: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    items: z.ZodArray<z.ZodObject<{
        menu_id: z.ZodString;
        jumlah: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        jumlah: number;
        menu_id: string;
    }, {
        jumlah: number;
        menu_id: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    nama_pelanggan: string;
    tanggal_kirim: string;
    dp: number;
    items: {
        jumlah: number;
        menu_id: string;
    }[];
    pelanggan_id?: string | null | undefined;
    catatan?: string | null | undefined;
}, {
    nama_pelanggan: string;
    tanggal_kirim: string;
    items: {
        jumlah: number;
        menu_id: string;
    }[];
    pelanggan_id?: string | null | undefined;
    dp?: number | undefined;
    catatan?: string | null | undefined;
}>;
export declare const ubahPesananSchema: z.ZodObject<{
    nama_pelanggan: z.ZodOptional<z.ZodString>;
    tanggal_kirim: z.ZodOptional<z.ZodString>;
    pelanggan_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dp: z.ZodOptional<z.ZodNumber>;
    catatan: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        menu_id: z.ZodString;
        jumlah: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        jumlah: number;
        menu_id: string;
    }, {
        jumlah: number;
        menu_id: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    nama_pelanggan?: string | undefined;
    tanggal_kirim?: string | undefined;
    pelanggan_id?: string | null | undefined;
    dp?: number | undefined;
    catatan?: string | null | undefined;
    items?: {
        jumlah: number;
        menu_id: string;
    }[] | undefined;
}, {
    nama_pelanggan?: string | undefined;
    tanggal_kirim?: string | undefined;
    pelanggan_id?: string | null | undefined;
    dp?: number | undefined;
    catatan?: string | null | undefined;
    items?: {
        jumlah: number;
        menu_id: string;
    }[] | undefined;
}>;
export declare const ubahStatusPesananSchema: z.ZodObject<{
    status: z.ZodEnum<["baru", "diproses", "terkirim", "lunas", "batal"]>;
}, "strip", z.ZodTypeAny, {
    status: "baru" | "diproses" | "terkirim" | "lunas" | "batal";
}, {
    status: "baru" | "diproses" | "terkirim" | "lunas" | "batal";
}>;
export declare const rentangTanggalQuerySchema: z.ZodObject<{
    mulai: z.ZodOptional<z.ZodString>;
    akhir: z.ZodOptional<z.ZodString>;
    preset: z.ZodOptional<z.ZodEnum<["hari_ini", "besok", "lusa", "semua"]>>;
}, "strip", z.ZodTypeAny, {
    mulai?: string | undefined;
    akhir?: string | undefined;
    preset?: "hari_ini" | "besok" | "lusa" | "semua" | undefined;
}, {
    mulai?: string | undefined;
    akhir?: string | undefined;
    preset?: "hari_ini" | "besok" | "lusa" | "semua" | undefined;
}>;
export declare const cadanganSchema: z.ZodObject<{
    versi: z.ZodNumber;
    diekspor_pada: z.ZodOptional<z.ZodString>;
    usaha: z.ZodOptional<z.ZodObject<{
        nama: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        nama: string;
    }, {
        nama: string;
    }>>;
    bahan: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        nama: z.ZodString;
        satuan: z.ZodEnum<["g", "ml", "butir"]>;
        harga_per_satuan: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        nama: string;
        satuan: "g" | "ml" | "butir";
        harga_per_satuan: number;
    }, {
        id: string;
        nama: string;
        satuan: "g" | "ml" | "butir";
        harga_per_satuan: number;
    }>, "many">>;
    menu: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        nama: z.ZodString;
        harga_jual: z.ZodNumber;
        aktif: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        nama: string;
        harga_jual: number;
        aktif: boolean;
    }, {
        id: string;
        nama: string;
        harga_jual: number;
        aktif?: boolean | undefined;
    }>, "many">>;
    resep: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        menu_id: z.ZodString;
        bahan_id: z.ZodString;
        takaran: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        takaran: number;
        bahan_id: string;
        menu_id: string;
    }, {
        id: string;
        takaran: number;
        bahan_id: string;
        menu_id: string;
    }>, "many">>;
    pelanggan: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        nama: z.ZodString;
        kontak: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        nama: string;
        kontak?: string | null | undefined;
    }, {
        id: string;
        nama: string;
        kontak?: string | null | undefined;
    }>, "many">>;
    pesanan: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        pelanggan_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nama_pelanggan: z.ZodString;
        tanggal_kirim: z.ZodString;
        status: z.ZodEnum<["baru", "diproses", "terkirim", "lunas", "batal"]>;
        dp: z.ZodNumber;
        catatan: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        dibuat_pada: z.ZodOptional<z.ZodString>;
        items: z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            menu_id: z.ZodString;
            jumlah: z.ZodNumber;
            harga_jual_snapshot: z.ZodNumber;
            hpp_snapshot: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            jumlah: number;
            menu_id: string;
            harga_jual_snapshot: number;
            hpp_snapshot: number;
            id?: string | undefined;
        }, {
            jumlah: number;
            menu_id: string;
            harga_jual_snapshot: number;
            hpp_snapshot: number;
            id?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: "baru" | "diproses" | "terkirim" | "lunas" | "batal";
        nama_pelanggan: string;
        tanggal_kirim: string;
        dp: number;
        items: {
            jumlah: number;
            menu_id: string;
            harga_jual_snapshot: number;
            hpp_snapshot: number;
            id?: string | undefined;
        }[];
        dibuat_pada?: string | undefined;
        pelanggan_id?: string | null | undefined;
        catatan?: string | null | undefined;
    }, {
        id: string;
        status: "baru" | "diproses" | "terkirim" | "lunas" | "batal";
        nama_pelanggan: string;
        tanggal_kirim: string;
        dp: number;
        items: {
            jumlah: number;
            menu_id: string;
            harga_jual_snapshot: number;
            hpp_snapshot: number;
            id?: string | undefined;
        }[];
        dibuat_pada?: string | undefined;
        pelanggan_id?: string | null | undefined;
        catatan?: string | null | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    bahan: {
        id: string;
        nama: string;
        satuan: "g" | "ml" | "butir";
        harga_per_satuan: number;
    }[];
    menu: {
        id: string;
        nama: string;
        harga_jual: number;
        aktif: boolean;
    }[];
    resep: {
        id: string;
        takaran: number;
        bahan_id: string;
        menu_id: string;
    }[];
    pelanggan: {
        id: string;
        nama: string;
        kontak?: string | null | undefined;
    }[];
    pesanan: {
        id: string;
        status: "baru" | "diproses" | "terkirim" | "lunas" | "batal";
        nama_pelanggan: string;
        tanggal_kirim: string;
        dp: number;
        items: {
            jumlah: number;
            menu_id: string;
            harga_jual_snapshot: number;
            hpp_snapshot: number;
            id?: string | undefined;
        }[];
        dibuat_pada?: string | undefined;
        pelanggan_id?: string | null | undefined;
        catatan?: string | null | undefined;
    }[];
    versi: number;
    usaha?: {
        nama: string;
    } | undefined;
    diekspor_pada?: string | undefined;
}, {
    versi: number;
    bahan?: {
        id: string;
        nama: string;
        satuan: "g" | "ml" | "butir";
        harga_per_satuan: number;
    }[] | undefined;
    menu?: {
        id: string;
        nama: string;
        harga_jual: number;
        aktif?: boolean | undefined;
    }[] | undefined;
    resep?: {
        id: string;
        takaran: number;
        bahan_id: string;
        menu_id: string;
    }[] | undefined;
    pelanggan?: {
        id: string;
        nama: string;
        kontak?: string | null | undefined;
    }[] | undefined;
    pesanan?: {
        id: string;
        status: "baru" | "diproses" | "terkirim" | "lunas" | "batal";
        nama_pelanggan: string;
        tanggal_kirim: string;
        dp: number;
        items: {
            jumlah: number;
            menu_id: string;
            harga_jual_snapshot: number;
            hpp_snapshot: number;
            id?: string | undefined;
        }[];
        dibuat_pada?: string | undefined;
        pelanggan_id?: string | null | undefined;
        catatan?: string | null | undefined;
    }[] | undefined;
    usaha?: {
        nama: string;
    } | undefined;
    diekspor_pada?: string | undefined;
}>;
