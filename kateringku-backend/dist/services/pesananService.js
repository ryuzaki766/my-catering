"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PesananService = void 0;
const index_js_1 = require("../repositories/index.js");
const response_js_1 = require("../utils/response.js");
const STATUS_FLOW = ['baru', 'diproses', 'terkirim', 'lunas'];
class PesananService {
    get repo() {
        return (0, index_js_1.getRepository)();
    }
    async getAll(usahaId, filters) {
        return this.repo.getPesananList(usahaId, filters);
    }
    async getById(usahaId, id) {
        const pesanan = await this.repo.getPesananById(usahaId, id);
        if (!pesanan)
            throw new response_js_1.AppError('Pesanan tidak ditemukan', 404);
        return pesanan;
    }
    async create(usahaId, data) {
        return this.repo.buatPesananAtomik({
            usaha_id: usahaId,
            ...data,
        });
    }
    async update(usahaId, id, data) {
        return this.repo.ubahPesananAtomik(usahaId, id, data);
    }
    async updateStatus(usahaId, id, status) {
        return this.repo.updateStatusPesanan(usahaId, id, status);
    }
    /**
     * Menaikkan status ke tahap berikutnya: baru -> diproses -> terkirim -> lunas (TC-24)
     */
    async advanceStatus(usahaId, id) {
        const cur = await this.getById(usahaId, id);
        if (cur.status === 'batal') {
            throw new response_js_1.AppError('Pesanan yang sudah dibatalkan tidak bisa diubah statusnya secara otomatis', 400);
        }
        const idx = STATUS_FLOW.indexOf(cur.status);
        if (idx === -1 || idx >= STATUS_FLOW.length - 1) {
            return cur; // Sudah mencapai status akhir ('lunas')
        }
        const nextStatus = STATUS_FLOW[idx + 1];
        return this.repo.updateStatusPesanan(usahaId, id, nextStatus);
    }
    async cancel(usahaId, id) {
        return this.repo.updateStatusPesanan(usahaId, id, 'batal');
    }
    async delete(usahaId, id) {
        const deleted = await this.repo.deletePesanan(usahaId, id);
        if (!deleted)
            throw new response_js_1.AppError('Pesanan tidak ditemukan', 404);
        return true;
    }
}
exports.PesananService = PesananService;
//# sourceMappingURL=pesananService.js.map