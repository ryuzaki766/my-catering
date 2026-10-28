"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_js_1 = __importDefault(require("./authRoutes.js"));
const bahanRoutes_js_1 = __importDefault(require("./bahanRoutes.js"));
const menuRoutes_js_1 = __importDefault(require("./menuRoutes.js"));
const pesananRoutes_js_1 = __importDefault(require("./pesananRoutes.js"));
const pelangganRoutes_js_1 = __importDefault(require("./pelangganRoutes.js"));
const produksiRoutes_js_1 = __importDefault(require("./produksiRoutes.js"));
const belanjaRoutes_js_1 = __importDefault(require("./belanjaRoutes.js"));
const dashboardRoutes_js_1 = __importDefault(require("./dashboardRoutes.js"));
const onboardingRoutes_js_1 = __importDefault(require("./onboardingRoutes.js"));
const cadanganRoutes_js_1 = __importDefault(require("./cadanganRoutes.js"));
const router = (0, express_1.Router)();
// Health Check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        app: 'KateringKu Backend API',
        waktu: new Date().toISOString(),
    });
});
// Mount modules
router.use('/auth', authRoutes_js_1.default);
router.use('/bahan', bahanRoutes_js_1.default);
router.use('/menu', menuRoutes_js_1.default);
router.use('/pesanan', pesananRoutes_js_1.default);
router.use('/pelanggan', pelangganRoutes_js_1.default);
router.use('/produksi', produksiRoutes_js_1.default);
router.use('/belanja', belanjaRoutes_js_1.default);
router.use('/dashboard', dashboardRoutes_js_1.default);
router.use('/onboarding', onboardingRoutes_js_1.default);
router.use('/cadangan', cadanganRoutes_js_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map