import { KebutuhanBahanItem, MenuTanpaResepItem } from '../types/index.js';
/**
 * Format angka ke mata uang Rupiah
 * Contoh: 25000 -> "Rp 25.000"
 */
export declare function formatRupiah(nilai: number): string;
/**
 * Format tanggal YYYY-MM-DD ke format lokal Indonesia ringkas
 * Contoh: "2026-10-07" -> "7 Okt 2026"
 */
export declare function formatTanggalIndonesia(tanggalStr: string): string;
/**
 * Format WhatsApp shopping list (US-09 & TC-25)
 */
export declare function formatTeksWhatsApp(namaUsaha: string, tanggalMulai: string, tanggalAkhir: string, items: KebutuhanBahanItem[], totalBiaya: number, menuTanpaResep?: MenuTanpaResepItem[]): string;
