"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_js_1 = require("../controllers/authController.js");
const validate_js_1 = require("../middlewares/validate.js");
const validasi_js_1 = require("../utils/validasi.js");
const auth_js_1 = require("../middlewares/auth.js");
const router = (0, express_1.Router)();
router.post('/register', (0, validate_js_1.validateBody)(validasi_js_1.daftarSchema), authController_js_1.AuthController.register);
router.post('/login', (0, validate_js_1.validateBody)(validasi_js_1.masukSchema), authController_js_1.AuthController.login);
router.post('/logout', authController_js_1.AuthController.logout);
router.get('/me', auth_js_1.authMiddleware, authController_js_1.AuthController.me);
router.post('/usaha', auth_js_1.authMiddleware, (0, validate_js_1.validateBody)(validasi_js_1.buatUsahaSchema), authController_js_1.AuthController.createUsaha);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map