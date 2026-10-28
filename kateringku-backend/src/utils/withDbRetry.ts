// ===== Ketahanan terhadap koneksi DB yang sesaat gagal =====
// Neon (free tier) mematikan compute saat idle; koneksi pertama setelah "bangun"
// bisa gagal sesaat. Utilitas ini mendeteksi error koneksi dan mengulang sekali.
import { AppError } from './response.js';

// Kode error Prisma yang berhubungan dengan koneksi (lihat: prisma.io/error-code)
const KODE_KONEKSI = new Set(['P1001', 'P1002', 'P1008', 'P1011', 'P1017', 'P2024']);

const PESAN_KONEKSI =
  /can't reach database server|connection closed|connection terminated|connection was forcibly|pool timed out|timed out fetching a new connection|ETIMEDOUT|ECONNREFUSED|ECONNRESET|EPIPE|socket hang up|getaddrinfo|network timeout/i;

/** True bila error adalah gangguan koneksi DB (bukan error bisnis/logika). */
export function isKoneksiDbError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: unknown; message?: unknown };
  if (e.code !== undefined && KODE_KONEKSI.has(String(e.code))) return true;
  return PESAN_KONEKSI.test(String(e.message ?? ''));
}

/**
 * Jalankan query; jika gagal karena koneksi DB, tunggu sebentar lalu ulangi.
 * Hanya error koneksi yang di-retry — AppError (401/400) langsung dilempar.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delayMs?: number } = {}
): Promise<T> {
  const retries = options.retries ?? 1;
  const delayMs = options.delayMs ?? 600;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err instanceof AppError || attempt === retries || !isKoneksiDbError(err)) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}
