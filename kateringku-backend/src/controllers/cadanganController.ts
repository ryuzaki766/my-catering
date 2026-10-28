import { Request, Response, NextFunction } from 'express';
import { CadanganService } from '../services/cadanganService.js';
import { apiSuccess } from '../utils/response.js';

const cadanganService = new CadanganService();

export class CadanganController {
  static async ekspor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cadanganService.ekspor(req.usahaId!);
      apiSuccess(res, data, 'Cadangan data berhasil diambil');
    } catch (err) {
      next(err);
    }
  }

  static async impor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hasil = await cadanganService.impor(req.usahaId!, req.body);
      apiSuccess(res, hasil, 'Data berhasil dipulihkan dari cadangan');
    } catch (err) {
      next(err);
    }
  }
}
