import { RekapProduksiItem } from '../types/index.js';
export interface RekapProduksiResponse {
    rentang: {
        mulai: string;
        akhir: string;
    };
    total_seluruh_porsi: number;
    rekap: RekapProduksiItem[];
}
export declare class ProduksiService {
    private get repo();
    getRekap(usahaId: string, preset?: 'hari_ini' | 'besok' | 'lusa' | 'semua', mulai?: string, akhir?: string): Promise<RekapProduksiResponse>;
}
