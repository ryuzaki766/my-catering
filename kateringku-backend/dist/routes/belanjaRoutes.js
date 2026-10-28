"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const belanjaController_js_1 = require("../controllers/belanjaController.js");
const auth_js_1 = require("../middlewares/auth.js");
const validate_js_1 = require("../middlewares/validate.js");
const validasi_js_1 = require("../utils/validasi.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authMiddleware);
router.use(auth_js_1.requireUsahaMiddleware);
router.get('/', (0, validate_js_1.validateQuery)(validasi_js_1.rentangTanggalQuerySchema), belanjaController_js_1.BelanjaController.getDaftarBelanja);
exports.default = router;
//# sourceMappingURL=belanjaRoutes.js.map