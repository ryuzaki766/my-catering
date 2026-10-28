"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const index_js_1 = require("../repositories/index.js");
const response_js_1 = require("../utils/response.js");
const withDbRetry_js_1 = require("../utils/withDbRetry.js");
class AuthService {
    get repo() {
        return (0, index_js_1.getRepository)();
    }
    generateToken(userId, email) {
        return jsonwebtoken_1.default.sign({ userId, email }, env_js_1.config.jwtSecret, {
            expiresIn: env_js_1.config.jwtExpiresIn,
        });
    }
    async register(data) {
        // Hanya pembacaan yang di-retry; pembuatan data tidak diulang agar tidak
        // berisiko duplikat bila query sebelumnya sebenarnya sudah masuk.
        const existing = await (0, withDbRetry_js_1.withDbRetry)(() => this.repo.findUserByEmail(data.email));
        if (existing) {
            throw new response_js_1.AppError('Email sudah terdaftar', 400);
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hash = await bcryptjs_1.default.hash(data.password, salt);
        const user = await this.repo.createUser(data.email, hash);
        const usaha = await this.repo.createUsaha(data.nama_usaha, user.id);
        const token = this.generateToken(user.id, user.email);
        return {
            user: { id: user.id, email: user.email },
            usaha,
            token,
        };
    }
    async login(data) {
        // Login hanya membaca data, aman diulang bila koneksi DB sempat gagal sesaat
        // (mis. compute Neon baru bangun dari auto-suspend).
        return (0, withDbRetry_js_1.withDbRetry)(async () => {
            const user = await this.repo.findUserByEmail(data.email);
            if (!user || !user.password_hash) {
                throw new response_js_1.AppError('Email atau password salah', 401);
            }
            const match = await bcryptjs_1.default.compare(data.password, user.password_hash);
            if (!match) {
                throw new response_js_1.AppError('Email atau password salah', 401);
            }
            const usaha = await this.repo.getUsahaByUserId(user.id);
            if (!usaha) {
                throw new response_js_1.AppError('Akun belum terhubung dengan usaha', 400);
            }
            const token = this.generateToken(user.id, user.email);
            return {
                user: { id: user.id, email: user.email },
                usaha,
                token,
            };
        });
    }
    async getMe(userId) {
        return (0, withDbRetry_js_1.withDbRetry)(async () => {
            const user = await this.repo.findUserById(userId);
            if (!user)
                throw new response_js_1.AppError('Pengguna tidak ditemukan', 404);
            const usaha = await this.repo.getUsahaByUserId(userId);
            return {
                user: { id: user.id, email: user.email },
                usaha,
            };
        });
    }
    async createUsaha(userId, namaUsaha) {
        const existingUsaha = await this.repo.getUsahaByUserId(userId);
        if (existingUsaha) {
            throw new response_js_1.AppError('Pengguna sudah punya usaha', 400);
        }
        return this.repo.createUsaha(namaUsaha, userId);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map