import { Router } from 'express';
import { MenuController } from '../controllers/menuController.js';
import { ResepController } from '../controllers/resepController.js';
import { authMiddleware, requireUsahaMiddleware } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { buatMenuSchema, ubahMenuSchema, aturResepSchema } from '../utils/validasi.js';

const router = Router();

router.use(authMiddleware);
router.use(requireUsahaMiddleware);

// Menu CRUD
router.get('/', MenuController.getAll);
router.get('/:id', MenuController.getById);
router.post('/', validateBody(buatMenuSchema), MenuController.create);
router.put('/:id', validateBody(ubahMenuSchema), MenuController.update);
router.delete('/:id', MenuController.delete);

// Resep under menu
router.get('/:menuId/resep', ResepController.getByMenuId);
router.put('/:menuId/resep', validateBody(aturResepSchema), ResepController.setResep);
router.delete('/:menuId/resep/:bahanId', ResepController.deleteResepItem);

export default router;
