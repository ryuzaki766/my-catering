"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BahanService = void 0;
const index_js_1 = require("../repositories/index.js");
const response_js_1 = require("../utils/response.js");
class BahanService {
    get repo() {
        return (0, index_js_1.getRepository)();
    }
    async getAll(usahaId) {
        return this.repo.getBahanList(usahaId);
    }
    async getById(usahaId, id) {
        const bahan = await this.repo.getBahanById(usahaId, id);
        if (!bahan)
            throw new response_js_1.AppError('Bahan tidak ditemukan', 404);
        return bahan;
    }
    async create(usahaId, data) {
        if (data.harga_per_satuan < 0) {
            throw new response_js_1.AppError('Harga per satuan tidak boleh negatif', 400);
        }
        return this.repo.createBahan(usahaId, data);
    }
    async update(usahaId, id, data) {
        if (data.harga_per_satuan !== undefined && data.harga_per_satuan < 0) {
            throw new response_js_1.AppError('Harga per satuan tidak boleh negatif', 400);
        }
        return this.repo.updateBahan(usahaId, id, data);
    }
    async delete(usahaId, id) {
        const isUsed = await this.repo.isBahanUsedInResep(usahaId, id);
        if (isUsed) {
            throw new response_js_1.AppError('Bahan tidak bisa dihapus karena masih digunakan dalam resep menu. Disarankan untuk memperbarui harga atau menghapusnya dari resep terlebih dahulu.', 400);
        }
        const deleted = await this.repo.deleteBahan(usahaId, id);
        if (!deleted)
            throw new response_js_1.AppError('Bahan tidak ditemukan', 404);
        return true;
    }
}
exports.BahanService = BahanService;
//# sourceMappingURL=bahanService.js.map