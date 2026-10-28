import { Request, Response, NextFunction } from 'express';
import { ResepService } from '../services/resepService.js';
import { apiSuccess } from '../utils/response.js';

const resepService = new ResepService();

export class ResepController {
  static async getByMenuId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await resepService.getByMenuId(req.usahaId!, req.params.menuId);
      apiSuccess(res, data, 'Resep menu berhasil diambil');
    } catch (err) {
      next(err);
    }
  }

  static async setResep(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await resepService.setResep(req.usahaId!, req.params.menuId, req.body.items);
      apiSuccess(res, data, 'Resep menu berhasil diperbarui');
    } catch (err) {
      next(err);
    }
  }

  static async deleteResepItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await resepService.deleteResepItem(req.usahaId!, req.params.menuId, req.params.bahanId);
      apiSuccess(res, null, 'Bahan berhasil dihapus dari resep');
    } catch (err) {
      next(err);
    }
  }
}
