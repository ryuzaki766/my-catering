import { Request, Response, NextFunction } from 'express';
import { ProduksiService } from '../services/produksiService.js';
import { apiSuccess } from '../utils/response.js';

const produksiService = new ProduksiService();

export class ProduksiController {
  static async getRekap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { preset, mulai, akhir } = req.query as any;
      const data = await produksiService.getRekap(req.usahaId!, preset, mulai, akhir);
      apiSuccess(res, data, 'Rekap produksi berhasil diambil');
    } catch (err) {
      next(err);
    }
  }
}
