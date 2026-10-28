"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProduksiController = void 0;
const produksiService_js_1 = require("../services/produksiService.js");
const response_js_1 = require("../utils/response.js");
const produksiService = new produksiService_js_1.ProduksiService();
class ProduksiController {
    static async getRekap(req, res, next) {
        try {
            const { preset, mulai, akhir } = req.query;
            const data = await produksiService.getRekap(req.usahaId, preset, mulai, akhir);
            (0, response_js_1.apiSuccess)(res, data, 'Rekap produksi berhasil diambil');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ProduksiController = ProduksiController;
//# sourceMappingURL=produksiController.js.map