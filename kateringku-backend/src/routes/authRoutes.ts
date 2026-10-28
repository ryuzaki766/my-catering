import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { validateBody } from '../middlewares/validate.js';
import { daftarSchema, masukSchema, buatUsahaSchema } from '../utils/validasi.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.post('/register', validateBody(daftarSchema), AuthController.register);
router.post('/login', validateBody(masukSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authMiddleware, AuthController.me);
router.post('/usaha', authMiddleware, validateBody(buatUsahaSchema), AuthController.createUsaha);

export default router;
