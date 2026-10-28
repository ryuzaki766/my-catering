"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BahanController = void 0;
const bahanService_js_1 = require("../services/bahanService.js");
const response_js_1 = require("../utils/response.js");
const bahanService = new bahanService_js_1.BahanService();
class BahanController {
    static async getAll(req, res, next) {
        try {
            const data = await bahanService.getAll(req.usahaId);
            (0, response_js_1.apiSuccess)(res, data, 'Daftar bahan berhasil diambil');
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const data = await bahanService.getById(req.usahaId, req.params.id);
            (0, response_js_1.apiSuccess)(res, data, 'Detail bahan berhasil diambil');
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        try {
            const data = await bahanService.create(req.usahaId, req.body);
            (0, response_js_1.apiSuccess)(res, data, 'Bahan berhasil ditambahkan', 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const data = await bahanService.update(req.usahaId, req.params.id, req.body);
            (0, response_js_1.apiSuccess)(res, data, 'Bahan berhasil diperbarui');
        }
        catch (err) {
            next(err);
        }
    }
    static async delete(req, res, next) {
        try {
            await bahanService.delete(req.usahaId, req.params.id);
            (0, response_js_1.apiSuccess)(res, null, 'Bahan berhasil dihapus');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.BahanController = BahanController;
//# sourceMappingURL=bahanController.js.map