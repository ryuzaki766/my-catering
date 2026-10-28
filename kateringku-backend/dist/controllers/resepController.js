"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResepController = void 0;
const resepService_js_1 = require("../services/resepService.js");
const response_js_1 = require("../utils/response.js");
const resepService = new resepService_js_1.ResepService();
class ResepController {
    static async getByMenuId(req, res, next) {
        try {
            const data = await resepService.getByMenuId(req.usahaId, req.params.menuId);
            (0, response_js_1.apiSuccess)(res, data, 'Resep menu berhasil diambil');
        }
        catch (err) {
            next(err);
        }
    }
    static async setResep(req, res, next) {
        try {
            const data = await resepService.setResep(req.usahaId, req.params.menuId, req.body.items);
            (0, response_js_1.apiSuccess)(res, data, 'Resep menu berhasil diperbarui');
        }
        catch (err) {
            next(err);
        }
    }
    static async deleteResepItem(req, res, next) {
        try {
            await resepService.deleteResepItem(req.usahaId, req.params.menuId, req.params.bahanId);
            (0, response_js_1.apiSuccess)(res, null, 'Bahan berhasil dihapus dari resep');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ResepController = ResepController;
//# sourceMappingURL=resepController.js.map