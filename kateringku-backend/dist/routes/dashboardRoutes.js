"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_js_1 = require("../controllers/dashboardController.js");
const auth_js_1 = require("../middlewares/auth.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authMiddleware);
router.use(auth_js_1.requireUsahaMiddleware);
router.get('/', dashboardController_js_1.DashboardController.getDashboard);
exports.default = router;
//# sourceMappingURL=dashboardRoutes.js.map