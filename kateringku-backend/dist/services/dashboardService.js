"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const index_js_1 = require("../repositories/index.js");
class DashboardService {
    get repo() {
        return (0, index_js_1.getRepository)();
    }
    async getDashboard(usahaId, tanggal) {
        const data = await this.repo.ringkasanBeranda(usahaId, tanggal);
        const margin = data.omzet_bulan_ini > 0
            ? Math.round((data.laba_kotor_bulan_ini / data.omzet_bulan_ini) * 1000) / 10
            : 0;
        return {
            ...data,
            margin_bulan_ini_persen: margin,
        };
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=dashboardService.js.map