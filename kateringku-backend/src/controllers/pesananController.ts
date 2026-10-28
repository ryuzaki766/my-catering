import { Request, Response, NextFunction } from 'express';
import { PesananService } from '../services/pesananService.js';
import { apiSuccess } from '../utils/response.js';

const pesananService = new PesananService();

export class PesananController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tanggal, mulai, akhir, status } = req.query as any;
      const data = await pesananService.getAll(req.usahaId!, {
        tanggal,
        mulai,
        akhir,
        status,
      });
      apiSuccess(res, data, 'Daftar pesanan berhasil diambil');
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pesananService.getById(req.usahaId!, req.params.id);
      apiSuccess(res, data, 'Detail pesanan berhasil diambil');
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pesananService.create(req.usahaId!, req.body);
      apiSuccess(res, data, 'Pesanan berhasil dibuat', 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pesananService.update(req.usahaId!, req.params.id, req.body);
      apiSuccess(res, data, 'Pesanan berhasil diperbarui');
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pesananService.updateStatus(req.usahaId!, req.params.id, req.body.status);
      apiSuccess(res, data, 'Status pesanan berhasil diperbarui');
    } catch (err) {
      next(err);
    }
  }

  static async advanceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pesananService.advanceStatus(req.usahaId!, req.params.id);
      apiSuccess(res, data, `Status pesanan dimajukan menjadi "${data.status}"`);
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pesananService.cancel(req.usahaId!, req.params.id);
      apiSuccess(res, data, 'Pesanan berhasil dibatalkan');
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await pesananService.delete(req.usahaId!, req.params.id);
      apiSuccess(res, null, 'Pesanan berhasil dihapus');
    } catch (err) {
      next(err);
    }
  }
}
