"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResepService = void 0;
const index_js_1 = require("../repositories/index.js");
const response_js_1 = require("../utils/response.js");
class ResepService {
    get repo() {
        return (0, index_js_1.getRepository)();
    }
    async getByMenuId(usahaId, menuId) {
        const menu = await this.repo.getMenuById(usahaId, menuId);
        if (!menu)
            throw new response_js_1.AppError('Menu tidak ditemukan', 404);
        return this.repo.getResepByMenuId(usahaId, menuId);
    }
    async setResep(usahaId, menuId, items) {
        const menu = await this.repo.getMenuById(usahaId, menuId);
        if (!menu)
            throw new response_js_1.AppError('Menu tidak ditemukan', 404);
        // Cek duplikasi bahan (TC-09)
        const seen = new Set();
        for (const it of items) {
            if (seen.has(it.bahan_id)) {
                throw new response_js_1.AppError('Bahan yang sama tidak boleh dimasukkan dua kali dalam satu resep', 400);
            }
            seen.add(it.bahan_id);
            if (it.takaran <= 0) {
                throw new response_js_1.AppError('Takaran harus lebih dari 0', 400);
            }
        }
        return this.repo.setResepForMenu(usahaId, menuId, items);
    }
    async deleteResepItem(usahaId, menuId, bahanId) {
        return this.repo.deleteResepItem(usahaId, menuId, bahanId);
    }
}
exports.ResepService = ResepService;
//# sourceMappingURL=resepService.js.map