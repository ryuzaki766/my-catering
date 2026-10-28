import { Request, Response, NextFunction } from 'express';
import { PelangganService } from '../services/pelangganService.js';
import { apiSuccess } from '../utils/response.js';

const pelangganService = new PelangganService();

export class PelangganController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pelangganService.getAll(req.usahaId!);
      apiSuccess(res, data, 'Daftar pelanggan berhasil diambil');
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pelangganService.getById(req.usahaId!, req.params.id);
      apiSuccess(res, data, 'Detail pelanggan berhasil diambil');
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pelangganService.create(req.usahaId!, req.body);
      apiSuccess(res, data, 'Pelanggan berhasil ditambahkan', 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await pelangganService.update(req.usahaId!, req.params.id, req.body);
      apiSuccess(res, data, 'Pelanggan berhasil diperbarui');
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await pelangganService.delete(req.usahaId!, req.params.id);
      apiSuccess(res, null, 'Pelanggan berhasil dihapus');
    } catch (err) {
      next(err);
    }
  }
}
