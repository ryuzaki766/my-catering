import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { errorHandler } from '../../src/middlewares/errorHandler.js';
import { AppError } from '../../src/utils/response.js';

function mockRes() {
  const res: any = {
    statusCode: undefined as number | undefined,
    body: undefined as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

const req: any = {};
const next: any = () => {};

describe('Unit Tests: errorHandler.ts', () => {
  beforeEach(() => {
    // bisukan log "Unhandled Error" agar output test bersih
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Error koneksi Prisma (P1001) → 503 dengan pesan ramah', () => {
    const err = Object.assign(
      new Error(
        "Can't reach database server at `ep-xxx.neon.tech:5432`\nPlease make sure your database server is running"
      ),
      { code: 'P1001' }
    );
    const res = mockRes();
    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(503);
    expect(res.body.sukses).toBe(false);
    expect(res.body.pesan).toContain('Database sedang tidak terjangkau');
    expect(res.body.pesan).not.toContain('neon.tech'); // tidak bocor detail teknis
  });

  it('Error "pool timed out" (P2024) → 503', () => {
    const err = Object.assign(new Error('Timed out fetching a new connection from the connection pool'), {
      code: 'P2024',
    });
    const res = mockRes();
    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(503);
    expect(res.body.pesan).toContain('coba lagi');
  });

  it('AppError 401 tetap memakai status & pesan aslinya (tidak diubah jadi 503)', () => {
    const res = mockRes();
    errorHandler(new AppError('Email atau password salah', 401), req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.pesan).toBe('Email atau password salah');
  });

  it('Error tak dikenal → 500 dengan pesan default bila tidak ada pesan', () => {
    const res = mockRes();
    errorHandler(new Error('boom'), req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res.body.pesan).toBe('boom');
  });
});
