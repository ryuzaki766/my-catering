"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BelanjaService = void 0;
const index_js_1 = require("../repositories/index.js");
const dateHelper_js_1 = require("../utils/dateHelper.js");
const format_js_1 = require("../utils/format.js");
class BelanjaService {
    get repo() {
        return (0, index_js_1.getRepository)();
    }
    async getDaftarBelanja(usahaId, preset, mulai, akhir) {
        const rentang = (0, dateHelper_js_1.resolveRentangTanggal)(preset, mulai, akhir);
        const kebutuhan = await this.repo.kebutuhanBahan(usahaId, rentang.mulai, rentang.akhir);
        const menuTanpaResep = await this.repo.menuTanpaResep(usahaId, rentang.mulai, rentang.akhir);
        const totalBiaya = kebutuhan.reduce((acc, k) => acc + k.biaya, 0);
        const usaha = await this.repo.getUsahaById(usahaId);
        const namaUsaha = usaha?.nama || 'KateringKu';
        const teksWhatsApp = (0, format_js_1.formatTeksWhatsApp)(namaUsaha, rentang.mulai, rentang.akhir, kebutuhan, totalBiaya, menuTanpaResep);
        return {
            rentang,
            kebutuhan,
            total_biaya: totalBiaya,
            menu_tanpa_resep: menuTanpaResep,
            teks_whatsapp: teksWhatsApp,
        };
    }
}
exports.BelanjaService = BelanjaService;
//# sourceMappingURL=belanjaService.js.map