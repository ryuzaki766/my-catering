import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.js';
import { authMiddleware, requireUsahaMiddleware } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);
router.use(requireUsahaMiddleware);

router.get('/', DashboardController.getDashboard);

export default router;
