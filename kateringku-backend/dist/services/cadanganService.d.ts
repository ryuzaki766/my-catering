import { CadanganData, CadanganHasilImpor } from '../types/index.js';
/**
 * Cadangan & Pemulihan Data (ekspor & impor).
 *
 * Ekspor: seluruh data usaha (bahan, menu, resep, pelanggan, pesanan + item
 * beserta snapshot harga) dalam satu berkas JSON.
 * Impor: SEMUA data usaha pemilik sesi diganti dengan isi cadangan
 * (bersifat mengganti, bukan menambah — supaya hasilnya selalu sama persis
 * dengan berkas cadangan).
 */
export declare class CadanganService {
    private get repo();
    ekspor(usahaId: string): Promise<CadanganData>;
    impor(usahaId: string, data: CadanganData): Promise<CadanganHasilImpor>;
    /**
     * Berkas cadangan harus konsisten sendiri: setiap rujukan (resep → bahan/menu,
     * item pesanan → menu, pesanan → pelanggan) harus menunjuk ke data yang ikut
     * ada di dalam berkas, dan setiap ID harus unik.
     */
    private validasiCadangan;
}
