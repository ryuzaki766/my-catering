"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuController = void 0;
const menuService_js_1 = require("../services/menuService.js");
const response_js_1 = require("../utils/response.js");
const menuService = new menuService_js_1.MenuService();
class MenuController {
    static async getAll(req, res, next) {
        try {
            const data = await menuService.getAll(req.usahaId);
            (0, response_js_1.apiSuccess)(res, data, 'Daftar menu berhasil diambil');
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const data = await menuService.getById(req.usahaId, req.params.id);
            (0, response_js_1.apiSuccess)(res, data, 'Detail menu berhasil diambil');
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        try {
            const data = await menuService.create(req.usahaId, req.body);
            (0, response_js_1.apiSuccess)(res, data, 'Menu berhasil ditambahkan', 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const data = await menuService.update(req.usahaId, req.params.id, req.body);
            (0, response_js_1.apiSuccess)(res, data, 'Menu berhasil diperbarui');
        }
        catch (err) {
            next(err);
        }
    }
    static async delete(req, res, next) {
        try {
            await menuService.delete(req.usahaId, req.params.id);
            (0, response_js_1.apiSuccess)(res, null, 'Menu berhasil dihapus');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.MenuController = MenuController;
//# sourceMappingURL=menuController.js.map