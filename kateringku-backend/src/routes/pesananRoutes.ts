import { Router } from 'express';
import { PesananController } from '../controllers/pesananController.js';
import { authMiddleware, requireUsahaMiddleware } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { buatPesananSchema, ubahPesananSchema, ubahStatusPesananSchema } from '../utils/validasi.js';

const router = Router();

router.use(authMiddleware);
router.use(requireUsahaMiddleware);

router.get('/', PesananController.getAll);
router.get('/:id', PesananController.getById);
router.post('/', validateBody(buatPesananSchema), PesananController.create);
router.put('/:id', validateBody(ubahPesananSchema), PesananController.update);
router.patch('/:id/status', validateBody(ubahStatusPesananSchema), PesananController.updateStatus);
router.post('/:id/advance-status', PesananController.advanceStatus);
router.post('/:id/batal', PesananController.cancel);
router.delete('/:id', PesananController.delete);

export default router;
