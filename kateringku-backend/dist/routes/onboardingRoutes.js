"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const onboardingController_js_1 = require("../controllers/onboardingController.js");
const auth_js_1 = require("../middlewares/auth.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authMiddleware);
router.use(auth_js_1.requireUsahaMiddleware);
router.post('/seed', onboardingController_js_1.OnboardingController.seedContohData);
exports.default = router;
//# sourceMappingURL=onboardingRoutes.js.map