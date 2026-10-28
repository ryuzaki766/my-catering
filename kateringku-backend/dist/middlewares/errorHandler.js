"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const response_js_1 = require("../utils/response.js");
const withDbRetry_js_1 = require("../utils/withDbRetry.js");
const PESAN_DB_TERJANGKAU = 'Database sedang tidak terjangkau — coba lagi beberapa saat lagi';
function errorHandler(err, req, res, next) {
    // Log error jika status code 500
    if (!err.statusCode || err.statusCode >= 500) {
        console.error('💥 Unhandled Error:', err);
    }
    // Gangguan koneksi DB (mis. Neon auto-suspend) → 503 dengan pesan yang manusiawi,
    // bukan menampilkan detail teknis Prisma ke pengguna.
    if (!(err instanceof response_js_1.AppError) && (0, withDbRetry_js_1.isKoneksiDbError)(err)) {
        (0, response_js_1.apiError)(res, PESAN_DB_TERJANGKAU, 503);
        return;
    }
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Terjadi kesalahan pada server';
    const details = err.details || undefined;
    (0, response_js_1.apiError)(res, message, statusCode, details);
}
//# sourceMappingURL=errorHandler.js.map