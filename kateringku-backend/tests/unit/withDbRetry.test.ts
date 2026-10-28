import { describe, it, expect } from 'vitest';
import { withDbRetry, isKoneksiDbError } from '../../src/utils/withDbRetry.js';
import { AppError } from '../../src/utils/response.js';

function errKoneksi(code: string, message = 'connection problem') {
  return Object.assign(new Error(message), { code });
}

describe('Unit Tests: withDbRetry.ts', () => {
  it('isKoneksiDbError mengenali kode Prisma P1001/P2024', () => {
    expect(isKoneksiDbError(errKoneksi('P1001'))).toBe(true);
    expect(isKoneksiDbError(errKoneksi('P2024'))).toBe(true);
    expect(isKoneksiDbError(errKoneksi('P2002'))).toBe(false); // unique violation ≠ koneksi
  });

  it('isKoneksiDbError mengenali pesan "Can\'t reach database server"', () => {
    expect(
      isKoneksiDbError(new Error("Can't reach database server at `host:5432`"))
    ).toBe(true);
  });

  it('AppError bukan error koneksi', () => {
    expect(isKoneksiDbError(new AppError('Email atau password salah', 401))).toBe(false);
  });

  it('Berhasil pada percobaan pertama tanpa retry', async () => {
    let panggilan = 0;
    const hasil = await withDbRetry(async () => {
      panggilan++;
      return 'ok';
    });
    expect(hasil).toBe('ok');
    expect(panggilan).toBe(1);
  });

  it('Mengulang sekali saat koneksi gagal, lalu berhasil', async () => {
    let panggilan = 0;
    const hasil = await withDbRetry(
      async () => {
        panggilan++;
        if (panggilan === 1) throw errKoneksi('P1001');
        return 'pulih';
      },
      { delayMs: 10 }
    );
    expect(hasil).toBe('pulih');
    expect(panggilan).toBe(2);
  });

  it('AppError tidak di-retry (langsung dilempar)', async () => {
    let panggilan = 0;
    await expect(
      withDbRetry(
        async () => {
          panggilan++;
          throw new AppError('Email atau password salah', 401);
        },
        { delayMs: 10 }
      )
    ).rejects.toThrow('Email atau password salah');
    expect(panggilan).toBe(1);
  });

  it('Setelah retry habis, error koneksi tetap dilempar', async () => {
    let panggilan = 0;
    await expect(
      withDbRetry(
        async () => {
          panggilan++;
          throw errKoneksi('P1001');
        },
        { retries: 1, delayMs: 10 }
      )
    ).rejects.toMatchObject({ code: 'P1001' });
    expect(panggilan).toBe(2);
  });

  it('Error non-koneksi tidak di-retry', async () => {
    let panggilan = 0;
    await expect(
      withDbRetry(
        async () => {
          panggilan++;
          throw new Error('bug biasa');
        },
        { delayMs: 10 }
      )
    ).rejects.toThrow('bug biasa');
    expect(panggilan).toBe(1);
  });
});
