import { Router } from 'express';
import { BelanjaController } from '../controllers/belanjaController.js';
import { authMiddleware, requireUsahaMiddleware } from '../middlewares/auth.js';
import { validateQuery } from '../middlewares/validate.js';
import { rentangTanggalQuerySchema } from '../utils/validasi.js';

const router = Router();

router.use(authMiddleware);
router.use(requireUsahaMiddleware);

router.get('/', validateQuery(rentangTanggalQuerySchema), BelanjaController.getDaftarBelanja);

export default router;
