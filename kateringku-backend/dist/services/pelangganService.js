"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PelangganService = void 0;
const index_js_1 = require("../repositories/index.js");
const response_js_1 = require("../utils/response.js");
class PelangganService {
    get repo() {
        return (0, index_js_1.getRepository)();
    }
    async getAll(usahaId) {
        return this.repo.getPelangganList(usahaId);
    }
    async getById(usahaId, id) {
        const p = await this.repo.getPelangganById(usahaId, id);
        if (!p)
            throw new response_js_1.AppError('Pelanggan tidak ditemukan', 404);
        return p;
    }
    async create(usahaId, data) {
        return this.repo.createPelanggan(usahaId, data);
    }
    async update(usahaId, id, data) {
        return this.repo.updatePelanggan(usahaId, id, data);
    }
    async delete(usahaId, id) {
        const deleted = await this.repo.deletePelanggan(usahaId, id);
        if (!deleted)
            throw new response_js_1.AppError('Pelanggan tidak ditemukan', 404);
        return true;
    }
}
exports.PelangganService = PelangganService;
//# sourceMappingURL=pelangganService.js.map