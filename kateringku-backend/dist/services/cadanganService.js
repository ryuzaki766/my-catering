"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CadanganService = void 0;
const index_js_1 = require("../repositories/index.js");
const index_js_2 = require("../types/index.js");
const response_js_1 = require("../utils/response.js");
/**
 * Cadangan & Pemulihan Data (ekspor & impor).
 *
 * Ekspor: seluruh data usaha (bahan, menu, resep, pelanggan, pesanan + item
 * beserta snapshot harga) dalam satu berkas JSON.
 * Impor: SEMUA data usaha pemilik sesi diganti dengan isi cadangan
 * (bersifat mengganti, bukan menambah — supaya hasilnya selalu sama persis
 * dengan berkas cadangan).
 */
class CadanganService {
    get repo() {
        return (0, index_js_1.getRepository)();
    }
    async ekspor(usahaId) {
        const isi = await this.repo.eksporCadangan(usahaId);
        return {
            versi: index_js_2.CADANGAN_VERSI,
            diekspor_pada: new Date().toISOString(),
            ...isi,
        };
    }
    async impor(usahaId, data) {
        this.validasiCadangan(data);
        return this.repo.imporCadangan(usahaId, data);
    }
    /**
     * Berkas cadangan harus konsisten sendiri: setiap rujukan (resep → bahan/menu,
     * item pesanan → menu, pesanan → pelanggan) harus menunjuk ke data yang ikut
     * ada di dalam berkas, dan setiap ID harus unik.
     */
    validasiCadangan(data) {
        const cekUnik = (nama, ids) => {
            if (new Set(ids).size !== ids.length) {
                throw new response_js_1.AppError(`Ada ID ${nama} ganda di dalam berkas cadangan`, 400);
            }
        };
        cekUnik('bahan', data.bahan.map((b) => b.id));
        cekUnik('menu', data.menu.map((m) => m.id));
        cekUnik('resep', data.resep.map((r) => r.id));
        cekUnik('pelanggan', data.pelanggan.map((p) => p.id));
        cekUnik('pesanan', data.pesanan.map((p) => p.id));
        const idBahan = new Set(data.bahan.map((b) => b.id));
        const idMenu = new Set(data.menu.map((m) => m.id));
        const idPelanggan = new Set(data.pelanggan.map((p) => p.id));
        for (const r of data.resep) {
            if (!idMenu.has(r.menu_id)) {
                throw new response_js_1.AppError(`Resep ${r.id} merujuk menu yang tidak ada di dalam cadangan`, 400);
            }
            if (!idBahan.has(r.bahan_id)) {
                throw new response_js_1.AppError(`Resep ${r.id} merujuk bahan yang tidak ada di dalam cadangan`, 400);
            }
        }
        for (const p of data.pesanan) {
            if (p.pelanggan_id && !idPelanggan.has(p.pelanggan_id)) {
                throw new response_js_1.AppError(`Pesanan "${p.nama_pelanggan}" merujuk pelanggan yang tidak ada di dalam cadangan`, 400);
            }
            for (const it of p.items) {
                if (!idMenu.has(it.menu_id)) {
                    throw new response_js_1.AppError(`Pesanan "${p.nama_pelanggan}" memuat menu yang tidak ada di dalam cadangan`, 400);
                }
            }
        }
    }
}
exports.CadanganService = CadanganService;
//# sourceMappingURL=cadanganService.js.map