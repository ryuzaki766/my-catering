"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pelangganController_js_1 = require("../controllers/pelangganController.js");
const auth_js_1 = require("../middlewares/auth.js");
const validate_js_1 = require("../middlewares/validate.js");
const validasi_js_1 = require("../utils/validasi.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authMiddleware);
router.use(auth_js_1.requireUsahaMiddleware);
router.get('/', pelangganController_js_1.PelangganController.getAll);
router.get('/:id', pelangganController_js_1.PelangganController.getById);
router.post('/', (0, validate_js_1.validateBody)(validasi_js_1.buatPelangganSchema), pelangganController_js_1.PelangganController.create);
router.put('/:id', (0, validate_js_1.validateBody)(validasi_js_1.buatPelangganSchema.partial()), pelangganController_js_1.PelangganController.update);
router.delete('/:id', pelangganController_js_1.PelangganController.delete);
exports.default = router;
//# sourceMappingURL=pelangganRoutes.js.map