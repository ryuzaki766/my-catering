"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BelanjaController = void 0;
const belanjaService_js_1 = require("../services/belanjaService.js");
const response_js_1 = require("../utils/response.js");
const belanjaService = new belanjaService_js_1.BelanjaService();
class BelanjaController {
    static async getDaftarBelanja(req, res, next) {
        try {
            const { preset, mulai, akhir } = req.query;
            const data = await belanjaService.getDaftarBelanja(req.usahaId, preset, mulai, akhir);
            (0, response_js_1.apiSuccess)(res, data, 'Daftar belanja berhasil diambil');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.BelanjaController = BelanjaController;
//# sourceMappingURL=belanjaController.js.map