import { DaftarBelanjaResponse } from '../types/index.js';
export declare class BelanjaService {
    private get repo();
    getDaftarBelanja(usahaId: string, preset?: 'hari_ini' | 'besok' | 'lusa' | 'semua', mulai?: string, akhir?: string): Promise<DaftarBelanjaResponse>;
}
