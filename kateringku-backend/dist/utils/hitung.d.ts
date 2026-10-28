import { SatuanDasar } from '../types/index.js';
export interface ItemResepHitung {
    takaran: number;
    harga_per_satuan: number;
}
/**
 * Menghitung HPP per porsi berdasarkan resep dan harga bahan.
 * Rumus: sum(takaran x harga_per_satuan)
 */
export declare function hitungHpp(resepItems: ItemResepHitung[]): number;
/**
 * Menghitung laba kotor per porsi: harga_jual - HPP
 */
export declare function hitungLabaKotor(hargaJual: number, hpp: number): number;
/**
 * Menghitung persentase margin keuntungan:
 * Rumus: ((harga_jual - HPP) / harga_jual) * 100%
 */
export declare function hitungMarginPersen(hargaJual: number, hpp: number): number;
export interface KonversiSatuanResult {
    satuan_dasar: SatuanDasar;
    total_dasar: number;
    satuan_tampilan: string;
    total_tampilan: number;
    tampilan_ramah: string;
}
/**
 * Mengonversi satuan dasar (g, ml, butir) ke tampilan ramah pengguna (kg, liter, butir).
 * Sesuai spesifikasi wireframe & TC-19:
 * 6000 g -> 6 kg
 * 25500 g -> 25,5 kg
 * 2100 ml -> 2,1 liter
 * 50 butir -> 50 butir
 */
export declare function konversiSatuan(totalDasar: number, satuan: SatuanDasar): KonversiSatuanResult;
