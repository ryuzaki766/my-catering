"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProduksiService = void 0;
const index_js_1 = require("../repositories/index.js");
const dateHelper_js_1 = require("../utils/dateHelper.js");
class ProduksiService {
    get repo() {
        return (0, index_js_1.getRepository)();
    }
    async getRekap(usahaId, preset, mulai, akhir) {
        const rentang = (0, dateHelper_js_1.resolveRentangTanggal)(preset, mulai, akhir);
        const rekap = await this.repo.rekapProduksi(usahaId, rentang.mulai, rentang.akhir);
        const totalSeluruhPorsi = rekap.reduce((acc, r) => acc + r.total_porsi, 0);
        return {
            rentang,
            total_seluruh_porsi: totalSeluruhPorsi,
            rekap,
        };
    }
}
exports.ProduksiService = ProduksiService;
//# sourceMappingURL=produksiService.js.map