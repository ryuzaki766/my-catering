import { Router } from 'express';
import { CadanganController } from '../controllers/cadanganController.js';
import { authMiddleware, requireUsahaMiddleware } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { cadanganSchema } from '../utils/validasi.js';

const router = Router();

router.use(authMiddleware);
router.use(requireUsahaMiddleware);

router.get('/', CadanganController.ekspor);
router.post('/', validateBody(cadanganSchema), CadanganController.impor);

export default router;
