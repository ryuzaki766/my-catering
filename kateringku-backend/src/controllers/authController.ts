import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { apiSuccess } from '../utils/response.js';

const authService = new AuthService();

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      apiSuccess(res, result, 'Pendaftaran berhasil', 201);
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      apiSuccess(res, result, 'Masuk berhasil', 200);
    } catch (err) {
      next(err);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.getMe(req.user!.id);
      apiSuccess(res, result, 'Profil pengguna');
    } catch (err) {
      next(err);
    }
  }

  static async createUsaha(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.createUsaha(req.user!.id, req.body.nama);
      apiSuccess(res, result, 'Usaha berhasil dibuat', 201);
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    apiSuccess(res, null, 'Berhasil keluar');
  }
}
