import { Router } from 'express';
import { BahanController } from '../controllers/bahanController.js';
import { authMiddleware, requireUsahaMiddleware } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { buatBahanSchema, ubahBahanSchema } from '../utils/validasi.js';

const router = Router();

router.use(authMiddleware);
router.use(requireUsahaMiddleware);

router.get('/', BahanController.getAll);
router.get('/:id', BahanController.getById);
router.post('/', validateBody(buatBahanSchema), BahanController.create);
router.put('/:id', validateBody(ubahBahanSchema), BahanController.update);
router.delete('/:id', BahanController.delete);

export default router;
