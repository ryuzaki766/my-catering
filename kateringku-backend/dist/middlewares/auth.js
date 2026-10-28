"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireUsahaMiddleware = requireUsahaMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const index_js_1 = require("../repositories/index.js");
const response_js_1 = require("../utils/response.js");
const withDbRetry_js_1 = require("../utils/withDbRetry.js");
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new response_js_1.AppError('Harus masuk terlebih dahulu (Token tidak ditemukan)', 401);
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, env_js_1.config.jwtSecret);
        }
        catch {
            throw new response_js_1.AppError('Sesi tidak valid atau telah kedaluwarsa', 401);
        }
        const repo = (0, index_js_1.getRepository)();
        // Pembacaan sesi diulang sekali bila koneksi DB sempat gagal sesaat
        const user = await (0, withDbRetry_js_1.withDbRetry)(() => repo.findUserById(decoded.userId));
        if (!user) {
            throw new response_js_1.AppError('Pengguna tidak ditemukan', 401);
        }
        const usaha = await (0, withDbRetry_js_1.withDbRetry)(() => repo.getUsahaByUserId(user.id));
        req.user = {
            id: user.id,
            email: user.email,
        };
        if (usaha) {
            req.usaha = usaha;
            req.usahaId = usaha.id;
        }
        next();
    }
    catch (err) {
        next(err);
    }
}
/**
 * Middleware untuk memastikan pengguna sudah memiliki usaha terdaftar
 */
function requireUsahaMiddleware(req, res, next) {
    if (!req.usahaId) {
        return next(new response_js_1.AppError('Pengguna belum memiliki usaha. Silakan buat usaha terlebih dahulu.', 403));
    }
    next();
}
//# sourceMappingURL=auth.js.map