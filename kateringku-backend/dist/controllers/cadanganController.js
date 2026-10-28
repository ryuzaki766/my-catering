"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CadanganController = void 0;
const cadanganService_js_1 = require("../services/cadanganService.js");
const response_js_1 = require("../utils/response.js");
const cadanganService = new cadanganService_js_1.CadanganService();
class CadanganController {
    static async ekspor(req, res, next) {
        try {
            const data = await cadanganService.ekspor(req.usahaId);
            (0, response_js_1.apiSuccess)(res, data, 'Cadangan data berhasil diambil');
        }
        catch (err) {
            next(err);
        }
    }
    static async impor(req, res, next) {
        try {
            const hasil = await cadanganService.impor(req.usahaId, req.body);
            (0, response_js_1.apiSuccess)(res, hasil, 'Data berhasil dipulihkan dari cadangan');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.CadanganController = CadanganController;
//# sourceMappingURL=cadanganController.js.map