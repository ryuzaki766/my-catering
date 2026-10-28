"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRentangTanggal = resolveRentangTanggal;
function resolveRentangTanggal(preset, mulai, akhir) {
    if (mulai && akhir) {
        return { mulai, akhir };
    }
    const now = new Date();
    const formatTgl = (d) => d.toISOString().split('T')[0];
    if (preset === 'hari_ini') {
        const tgl = formatTgl(now);
        return { mulai: tgl, akhir: tgl };
    }
    if (preset === 'besok') {
        const besok = new Date(now);
        besok.setDate(besok.getDate() + 1);
        const tgl = formatTgl(besok);
        return { mulai: tgl, akhir: tgl };
    }
    if (preset === 'lusa') {
        const lusa = new Date(now);
        lusa.setDate(lusa.getDate() + 2);
        const tgl = formatTgl(lusa);
        return { mulai: tgl, akhir: tgl };
    }
    if (preset === 'semua') {
        return { mulai: '2020-01-01', akhir: '2099-12-31' };
    }
    // Default: hari ini
    const tgl = formatTgl(now);
    return { mulai: tgl, akhir: tgl };
}
//# sourceMappingURL=dateHelper.js.map