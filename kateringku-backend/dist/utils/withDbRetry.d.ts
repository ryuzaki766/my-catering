/** True bila error adalah gangguan koneksi DB (bukan error bisnis/logika). */
export declare function isKoneksiDbError(err: unknown): boolean;
/**
 * Jalankan query; jika gagal karena koneksi DB, tunggu sebentar lalu ulangi.
 * Hanya error koneksi yang di-retry — AppError (401/400) langsung dilempar.
 */
export declare function withDbRetry<T>(fn: () => Promise<T>, options?: {
    retries?: number;
    delayMs?: number;
}): Promise<T>;
