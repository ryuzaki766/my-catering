import { PesananDetail, StatusPesanan } from '../types/index.js';
export declare class PesananService {
    private get repo();
    getAll(usahaId: string, filters?: {
        tanggal?: string;
        mulai?: string;
        akhir?: string;
        status?: StatusPesanan;
    }): Promise<PesananDetail[]>;
    getById(usahaId: string, id: string): Promise<PesananDetail>;
    create(usahaId: string, data: {
        nama_pelanggan: string;
        tanggal_kirim: string;
        pelanggan_id?: string | null;
        dp?: number;
        catatan?: string | null;
        items: Array<{
            menu_id: string;
            jumlah: number;
        }>;
    }): Promise<PesananDetail>;
    update(usahaId: string, id: string, data: {
        nama_pelanggan?: string;
        tanggal_kirim?: string;
        pelanggan_id?: string | null;
        dp?: number;
        catatan?: string | null;
        items?: Array<{
            menu_id: string;
            jumlah: number;
        }>;
    }): Promise<PesananDetail>;
    updateStatus(usahaId: string, id: string, status: StatusPesanan): Promise<PesananDetail>;
    /**
     * Menaikkan status ke tahap berikutnya: baru -> diproses -> terkirim -> lunas (TC-24)
     */
    advanceStatus(usahaId: string, id: string): Promise<PesananDetail>;
    cancel(usahaId: string, id: string): Promise<PesananDetail>;
    delete(usahaId: string, id: string): Promise<boolean>;
}
