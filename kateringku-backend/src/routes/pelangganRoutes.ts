import { Router } from 'express';
import { PelangganController } from '../controllers/pelangganController.js';
import { authMiddleware, requireUsahaMiddleware } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { buatPelangganSchema } from '../utils/validasi.js';

const router = Router();

router.use(authMiddleware);
router.use(requireUsahaMiddleware);

router.get('/', PelangganController.getAll);
router.get('/:id', PelangganController.getById);
router.post('/', validateBody(buatPelangganSchema), PelangganController.create);
router.put('/:id', validateBody(buatPelangganSchema.partial()), PelangganController.update);
router.delete('/:id', PelangganController.delete);

export default router;
