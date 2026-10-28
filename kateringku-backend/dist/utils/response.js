"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.apiSuccess = apiSuccess;
exports.apiError = apiError;
class AppError extends Error {
    statusCode;
    details;
    constructor(message, statusCode = 400, details) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.details = details;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
function apiSuccess(res, data, message = 'Sukses', statusCode = 200) {
    return res.status(statusCode).json({
        sukses: true,
        pesan: message,
        data,
    });
}
function apiError(res, message = 'Terjadi kesalahan', statusCode = 500, details) {
    return res.status(statusCode).json({
        sukses: false,
        pesan: message,
        rincian: details,
    });
}
//# sourceMappingURL=response.js.map