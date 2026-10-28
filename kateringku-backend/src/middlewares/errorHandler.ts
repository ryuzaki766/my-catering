import { Request, Response, NextFunction } from 'express';
import { AppError, apiError } from '../utils/response.js';
import { isKoneksiDbError } from '../utils/withDbRetry.js';

const PESAN_DB_TERJANGKAU =
  'Database sedang tidak terjangkau — coba lagi beberapa saat lagi';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error jika status code 500
  if (!err.statusCode || err.statusCode >= 500) {
    console.error('💥 Unhandled Error:', err);
  }

  // Gangguan koneksi DB (mis. Neon auto-suspend) → 503 dengan pesan yang manusiawi,
  // bukan menampilkan detail teknis Prisma ke pengguna.
  if (!(err instanceof AppError) && isKoneksiDbError(err)) {
    apiError(res, PESAN_DB_TERJANGKAU, 503);
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan pada server';
  const details = err.details || undefined;

  apiError(res, message, statusCode, details);
}
