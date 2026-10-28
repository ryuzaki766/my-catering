"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuService = void 0;
const index_js_1 = require("../repositories/index.js");
const hitung_js_1 = require("../utils/hitung.js");
const response_js_1 = require("../utils/response.js");
class MenuService {
    get repo() {
        return (0, index_js_1.getRepository)();
    }
    async getAll(usahaId) {
        const menus = await this.repo.getMenuList(usahaId);
        const result = [];
        for (const m of menus) {
            const resepList = await this.repo.getResepByMenuId(usahaId, m.id);
            const hpp = (0, hitung_js_1.hitungHpp)(resepList.map((r) => ({
                takaran: r.takaran,
                harga_per_satuan: r.harga_per_satuan || 0,
            })));
            const laba = (0, hitung_js_1.hitungLabaKotor)(m.harga_jual, hpp);
            const margin = (0, hitung_js_1.hitungMarginPersen)(m.harga_jual, hpp);
            result.push({
                ...m,
                hpp,
                laba_kotor: laba,
                margin_persen: margin,
                // Resep ikut dikirim pada daftar menu: data ini sudah diambil untuk
                // menghitung HPP, dan tanpa menyertakannya tampilan kehilangan seluruh
                // resep setiap kali halaman dimuat ulang (hanya `getById` yang punya).
                resep: resepList,
            });
        }
        return result;
    }
    async getById(usahaId, id) {
        const menu = await this.repo.getMenuById(usahaId, id);
        if (!menu)
            throw new response_js_1.AppError('Menu tidak ditemukan', 404);
        const resepList = await this.repo.getResepByMenuId(usahaId, id);
        const hpp = (0, hitung_js_1.hitungHpp)(resepList.map((r) => ({
            takaran: r.takaran,
            harga_per_satuan: r.harga_per_satuan || 0,
        })));
        const laba = (0, hitung_js_1.hitungLabaKotor)(menu.harga_jual, hpp);
        const margin = (0, hitung_js_1.hitungMarginPersen)(menu.harga_jual, hpp);
        return {
            ...menu,
            hpp,
            laba_kotor: laba,
            margin_persen: margin,
            resep: resepList,
        };
    }
    async create(usahaId, data) {
        if (data.harga_jual < 0) {
            throw new response_js_1.AppError('Harga jual tidak boleh negatif', 400);
        }
        return this.repo.createMenu(usahaId, data);
    }
    async update(usahaId, id, data) {
        if (data.harga_jual !== undefined && data.harga_jual < 0) {
            throw new response_js_1.AppError('Harga jual tidak boleh negatif', 400);
        }
        return this.repo.updateMenu(usahaId, id, data);
    }
    async delete(usahaId, id) {
        const deleted = await this.repo.deleteMenu(usahaId, id);
        if (!deleted)
            throw new response_js_1.AppError('Menu tidak ditemukan', 404);
        return true;
    }
}
exports.MenuService = MenuService;
//# sourceMappingURL=menuService.js.map