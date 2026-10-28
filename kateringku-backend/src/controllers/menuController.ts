import { Request, Response, NextFunction } from 'express';
import { MenuService } from '../services/menuService.js';
import { apiSuccess } from '../utils/response.js';

const menuService = new MenuService();

export class MenuController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await menuService.getAll(req.usahaId!);
      apiSuccess(res, data, 'Daftar menu berhasil diambil');
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await menuService.getById(req.usahaId!, req.params.id);
      apiSuccess(res, data, 'Detail menu berhasil diambil');
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await menuService.create(req.usahaId!, req.body);
      apiSuccess(res, data, 'Menu berhasil ditambahkan', 201);
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await menuService.update(req.usahaId!, req.params.id, req.body);
      apiSuccess(res, data, 'Menu berhasil diperbarui');
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await menuService.delete(req.usahaId!, req.params.id);
      apiSuccess(res, null, 'Menu berhasil dihapus');
    } catch (err) {
      next(err);
    }
  }
}
