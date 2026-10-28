import { Request, Response, NextFunction } from 'express';
import { BahanService } from '../services/bahanService.js';
import { apiSuccess } from '../utils/response.js';

const bahanService = new BahanService();

export class BahanController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await bahanService.getAll(req.usahaId!);
      apiSuccess(res, data, 'Daftar bahan berhasil diambil');
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await bahanService.getById(req.usahaId!, req.params.id);
      apiSuccess(res, data, 'Detail bahan berhasil diambil');
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await bahanService.create(req.usahaId!, req.body);
      apiSuccess(res, data, 'Bahan berhasil ditambahkan', 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await bahanService.update(req.usahaId!, req.params.id, req.body);
      apiSuccess(res, data, 'Bahan berhasil diperbarui');
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await bahanService.delete(req.usahaId!, req.params.id);
      apiSuccess(res, null, 'Bahan berhasil dihapus');
    } catch (err) {
      next(err);
    }
  }
}
