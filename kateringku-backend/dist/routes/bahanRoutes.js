"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bahanController_js_1 = require("../controllers/bahanController.js");
const auth_js_1 = require("../middlewares/auth.js");
const validate_js_1 = require("../middlewares/validate.js");
const validasi_js_1 = require("../utils/validasi.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authMiddleware);
router.use(auth_js_1.requireUsahaMiddleware);
router.get('/', bahanController_js_1.BahanController.getAll);
router.get('/:id', bahanController_js_1.BahanController.getById);
router.post('/', (0, validate_js_1.validateBody)(validasi_js_1.buatBahanSchema), bahanController_js_1.BahanController.create);
router.put('/:id', (0, validate_js_1.validateBody)(validasi_js_1.ubahBahanSchema), bahanController_js_1.BahanController.update);
router.delete('/:id', bahanController_js_1.BahanController.delete);
exports.default = router;
//# sourceMappingURL=bahanRoutes.js.map