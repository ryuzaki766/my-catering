"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PesananController = void 0;
const pesananService_js_1 = require("../services/pesananService.js");
const response_js_1 = require("../utils/response.js");
const pesananService = new pesananService_js_1.PesananService();
class PesananController {
    static async getAll(req, res, next) {
        try {
            const { tanggal, mulai, akhir, status } = req.query;
            const data = await pesananService.getAll(req.usahaId, {
                tanggal,
                mulai,
                akhir,
                status,
            });
            (0, response_js_1.apiSuccess)(res, data, 'Daftar pesanan berhasil diambil');
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const data = await pesananService.getById(req.usahaId, req.params.id);
            (0, response_js_1.apiSuccess)(res, data, 'Detail pesanan berhasil diambil');
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        try {
            const data = await pesananService.create(req.usahaId, req.body);
            (0, response_js_1.apiSuccess)(res, data, 'Pesanan berhasil dibuat', 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const data = await pesananService.update(req.usahaId, req.params.id, req.body);
            (0, response_js_1.apiSuccess)(res, data, 'Pesanan berhasil diperbarui');
        }
        catch (err) {
            next(err);
        }
    }
    static async updateStatus(req, res, next) {
        try {
            const data = await pesananService.updateStatus(req.usahaId, req.params.id, req.body.status);
            (0, response_js_1.apiSuccess)(res, data, 'Status pesanan berhasil diperbarui');
        }
        catch (err) {
            next(err);
        }
    }
    static async advanceStatus(req, res, next) {
        try {
            const data = await pesananService.advanceStatus(req.usahaId, req.params.id);
            (0, response_js_1.apiSuccess)(res, data, `Status pesanan dimajukan menjadi "${data.status}"`);
        }
        catch (err) {
            next(err);
        }
    }
    static async cancel(req, res, next) {
        try {
            const data = await pesananService.cancel(req.usahaId, req.params.id);
            (0, response_js_1.apiSuccess)(res, data, 'Pesanan berhasil dibatalkan');
        }
        catch (err) {
            next(err);
        }
    }
    static async delete(req, res, next) {
        try {
            await pesananService.delete(req.usahaId, req.params.id);
            (0, response_js_1.apiSuccess)(res, null, 'Pesanan berhasil dihapus');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PesananController = PesananController;
//# sourceMappingURL=pesananController.js.map