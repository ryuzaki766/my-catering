import { Request, Response, NextFunction } from 'express';
import { OnboardingService } from '../services/onboardingService.js';
import { apiSuccess } from '../utils/response.js';

const onboardingService = new OnboardingService();

export class OnboardingController {
  static async seedContohData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await onboardingService.seedContohData(req.usahaId!);
      apiSuccess(res, null, 'Data contoh bahan, menu, dan resep berhasil ditambahkan', 201);
    } catch (err) {
      next(err);
    }
  }
}
