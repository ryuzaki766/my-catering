"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PelangganController = void 0;
const pelangganService_js_1 = require("../services/pelangganService.js");
const response_js_1 = require("../utils/response.js");
const pelangganService = new pelangganService_js_1.PelangganService();
class PelangganController {
    static async getAll(req, res, next) {
        try {
            const data = await pelangganService.getAll(req.usahaId);
            (0, response_js_1.apiSuccess)(res, data, 'Daftar pelanggan berhasil diambil');
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const data = await pelangganService.getById(req.usahaId, req.params.id);
            (0, response_js_1.apiSuccess)(res, data, 'Detail pelanggan berhasil diambil');
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        try {
            const data = await pelangganService.create(req.usahaId, req.body);
            (0, response_js_1.apiSuccess)(res, data, 'Pelanggan berhasil ditambahkan', 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const data = await pelangganService.update(req.usahaId, req.params.id, req.body);
            (0, response_js_1.apiSuccess)(res, data, 'Pelanggan berhasil diperbarui');
        }
        catch (err) {
            next(err);
        }
    }
    static async delete(req, res, next) {
        try {
            await pelangganService.delete(req.usahaId, req.params.id);
            (0, response_js_1.apiSuccess)(res, null, 'Pelanggan berhasil dihapus');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PelangganController = PelangganController;
//# sourceMappingURL=pelangganController.js.map