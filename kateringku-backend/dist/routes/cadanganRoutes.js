"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cadanganController_js_1 = require("../controllers/cadanganController.js");
const auth_js_1 = require("../middlewares/auth.js");
const validate_js_1 = require("../middlewares/validate.js");
const validasi_js_1 = require("../utils/validasi.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authMiddleware);
router.use(auth_js_1.requireUsahaMiddleware);
router.get('/', cadanganController_js_1.CadanganController.ekspor);
router.post('/', (0, validate_js_1.validateBody)(validasi_js_1.cadanganSchema), cadanganController_js_1.CadanganController.impor);
exports.default = router;
//# sourceMappingURL=cadanganRoutes.js.map