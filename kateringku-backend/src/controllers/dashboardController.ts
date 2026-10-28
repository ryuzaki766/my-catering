import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService.js';
import { apiSuccess } from '../utils/response.js';

const dashboardService = new DashboardService();

export class DashboardController {
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tanggal } = req.query as any;
      const data = await dashboardService.getDashboard(req.usahaId!, tanggal);
      apiSuccess(res, data, 'Ringkasan beranda berhasil diambil');
    } catch (err) {
      next(err);
    }
  }
}
