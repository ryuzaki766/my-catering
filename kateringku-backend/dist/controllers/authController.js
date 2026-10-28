"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_js_1 = require("../services/authService.js");
const response_js_1 = require("../utils/response.js");
const authService = new authService_js_1.AuthService();
class AuthController {
    static async register(req, res, next) {
        try {
            const result = await authService.register(req.body);
            (0, response_js_1.apiSuccess)(res, result, 'Pendaftaran berhasil', 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async login(req, res, next) {
        try {
            const result = await authService.login(req.body);
            (0, response_js_1.apiSuccess)(res, result, 'Masuk berhasil', 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async me(req, res, next) {
        try {
            const result = await authService.getMe(req.user.id);
            (0, response_js_1.apiSuccess)(res, result, 'Profil pengguna');
        }
        catch (err) {
            next(err);
        }
    }
    static async createUsaha(req, res, next) {
        try {
            const result = await authService.createUsaha(req.user.id, req.body.nama);
            (0, response_js_1.apiSuccess)(res, result, 'Usaha berhasil dibuat', 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async logout(req, res) {
        (0, response_js_1.apiSuccess)(res, null, 'Berhasil keluar');
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=authController.js.map