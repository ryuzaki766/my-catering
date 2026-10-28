"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboardService_js_1 = require("../services/dashboardService.js");
const response_js_1 = require("../utils/response.js");
const dashboardService = new dashboardService_js_1.DashboardService();
class DashboardController {
    static async getDashboard(req, res, next) {
        try {
            const { tanggal } = req.query;
            const data = await dashboardService.getDashboard(req.usahaId, tanggal);
            (0, response_js_1.apiSuccess)(res, data, 'Ringkasan beranda berhasil diambil');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=dashboardController.js.map