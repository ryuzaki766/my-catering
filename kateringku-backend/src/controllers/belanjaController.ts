import { Request, Response, NextFunction } from 'express';
import { BelanjaService } from '../services/belanjaService.js';
import { apiSuccess } from '../utils/response.js';

const belanjaService = new BelanjaService();

export class BelanjaController {
  static async getDaftarBelanja(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { preset, mulai, akhir } = req.query as any;
      const data = await belanjaService.getDaftarBelanja(req.usahaId!, preset, mulai, akhir);
      apiSuccess(res, data, 'Daftar belanja berhasil diambil');
    } catch (err) {
      next(err);
    }
  }
}
