import { Router } from 'express';
import { OnboardingController } from '../controllers/onboardingController.js';
import { authMiddleware, requireUsahaMiddleware } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);
router.use(requireUsahaMiddleware);

router.post('/seed', OnboardingController.seedContohData);

export default router;
