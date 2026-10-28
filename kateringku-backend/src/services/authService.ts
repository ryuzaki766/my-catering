import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { getRepository } from '../repositories/index.js';
import { AppError } from '../utils/response.js';
import { withDbRetry } from '../utils/withDbRetry.js';
import { AuthSession, Usaha } from '../types/index.js';

export class AuthService {
  private get repo() {
    return getRepository();
  }

  private generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });
  }

  async register(data: { email: string; password: string; nama_usaha: string }): Promise<AuthSession> {
    // Hanya pembacaan yang di-retry; pembuatan data tidak diulang agar tidak
    // berisiko duplikat bila query sebelumnya sebenarnya sudah masuk.
    const existing = await withDbRetry(() => this.repo.findUserByEmail(data.email));
    if (existing) {
      throw new AppError('Email sudah terdaftar', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.password, salt);

    const user = await this.repo.createUser(data.email, hash);
    const usaha = await this.repo.createUsaha(data.nama_usaha, user.id);
    const token = this.generateToken(user.id, user.email);

    return {
      user: { id: user.id, email: user.email },
      usaha,
      token,
    };
  }

  async login(data: { email: string; password: string }): Promise<AuthSession> {
    // Login hanya membaca data, aman diulang bila koneksi DB sempat gagal sesaat
    // (mis. compute Neon baru bangun dari auto-suspend).
    return withDbRetry(async () => {
      const user = await this.repo.findUserByEmail(data.email);
      if (!user || !user.password_hash) {
        throw new AppError('Email atau password salah', 401);
      }

      const match = await bcrypt.compare(data.password, user.password_hash);
      if (!match) {
        throw new AppError('Email atau password salah', 401);
      }

      const usaha = await this.repo.getUsahaByUserId(user.id);
      if (!usaha) {
        throw new AppError('Akun belum terhubung dengan usaha', 400);
      }

      const token = this.generateToken(user.id, user.email);

      return {
        user: { id: user.id, email: user.email },
        usaha,
        token,
      };
    });
  }

  async getMe(userId: string): Promise<{ user: { id: string; email: string }; usaha: Usaha | null }> {
    return withDbRetry(async () => {
      const user = await this.repo.findUserById(userId);
      if (!user) throw new AppError('Pengguna tidak ditemukan', 404);

      const usaha = await this.repo.getUsahaByUserId(userId);
      return {
        user: { id: user.id, email: user.email },
        usaha,
      };
    });
  }

  async createUsaha(userId: string, namaUsaha: string): Promise<Usaha> {
    const existingUsaha = await this.repo.getUsahaByUserId(userId);
    if (existingUsaha) {
      throw new AppError('Pengguna sudah punya usaha', 400);
    }
    return this.repo.createUsaha(namaUsaha, userId);
  }
}
