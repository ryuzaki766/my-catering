import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { getRepository } from '../repositories/index.js';
import { AppError } from '../utils/response.js';
import { withDbRetry } from '../utils/withDbRetry.js';

interface JwtPayload {
  userId: string;
  email: string;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Harus masuk terlebih dahulu (Token tidak ditemukan)', 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch {
      throw new AppError('Sesi tidak valid atau telah kedaluwarsa', 401);
    }

    const repo = getRepository();
    // Pembacaan sesi diulang sekali bila koneksi DB sempat gagal sesaat
    const user = await withDbRetry(() => repo.findUserById(decoded.userId));
    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 401);
    }

    const usaha = await withDbRetry(() => repo.getUsahaByUserId(user.id));

    req.user = {
      id: user.id,
      email: user.email,
    };

    if (usaha) {
      req.usaha = usaha;
      req.usahaId = usaha.id;
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware untuk memastikan pengguna sudah memiliki usaha terdaftar
 */
export function requireUsahaMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.usahaId) {
    return next(new AppError('Pengguna belum memiliki usaha. Silakan buat usaha terlebih dahulu.', 403));
  }
  next();
}
