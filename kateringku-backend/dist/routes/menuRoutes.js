"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menuController_js_1 = require("../controllers/menuController.js");
const resepController_js_1 = require("../controllers/resepController.js");
const auth_js_1 = require("../middlewares/auth.js");
const validate_js_1 = require("../middlewares/validate.js");
const validasi_js_1 = require("../utils/validasi.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authMiddleware);
router.use(auth_js_1.requireUsahaMiddleware);
// Menu CRUD
router.get('/', menuController_js_1.MenuController.getAll);
router.get('/:id', menuController_js_1.MenuController.getById);
router.post('/', (0, validate_js_1.validateBody)(validasi_js_1.buatMenuSchema), menuController_js_1.MenuController.create);
router.put('/:id', (0, validate_js_1.validateBody)(validasi_js_1.ubahMenuSchema), menuController_js_1.MenuController.update);
router.delete('/:id', menuController_js_1.MenuController.delete);
// Resep under menu
router.get('/:menuId/resep', resepController_js_1.ResepController.getByMenuId);
router.put('/:menuId/resep', (0, validate_js_1.validateBody)(validasi_js_1.aturResepSchema), resepController_js_1.ResepController.setResep);
router.delete('/:menuId/resep/:bahanId', resepController_js_1.ResepController.deleteResepItem);
exports.default = router;
//# sourceMappingURL=menuRoutes.js.map