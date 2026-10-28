import { Router } from 'express';
import { ProduksiController } from '../controllers/produksiController.js';
import { authMiddleware, requireUsahaMiddleware } from '../middlewares/auth.js';
import { validateQuery } from '../middlewares/validate.js';
import { rentangTanggalQuerySchema } from '../utils/validasi.js';

const router = Router();

router.use(authMiddleware);
router.use(requireUsahaMiddleware);

router.get('/', validateQuery(rentangTanggalQuerySchema), ProduksiController.getRekap);

export default router;
