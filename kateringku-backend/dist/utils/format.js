"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatRupiah = formatRupiah;
exports.formatTanggalIndonesia = formatTanggalIndonesia;
exports.formatTeksWhatsApp = formatTeksWhatsApp;
/**
 * Format angka ke mata uang Rupiah
 * Contoh: 25000 -> "Rp 25.000"
 */
function formatRupiah(nilai) {
    const rounded = Math.round(nilai || 0);
    return 'Rp ' + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
/**
 * Format tanggal YYYY-MM-DD ke format lokal Indonesia ringkas
 * Contoh: "2026-10-07" -> "7 Okt 2026"
 */
function formatTanggalIndonesia(tanggalStr) {
    if (!tanggalStr)
        return '';
    const bulan = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const parts = tanggalStr.split('-');
    if (parts.length === 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return `${d} ${bulan[m] || ''} ${y}`;
    }
    return tanggalStr;
}
/**
 * Format WhatsApp shopping list (US-09 & TC-25)
 */
function formatTeksWhatsApp(namaUsaha, tanggalMulai, tanggalAkhir, items, totalBiaya, menuTanpaResep = []) {
    const tglAwal = formatTanggalIndonesia(tanggalMulai);
    const tglAkhir = formatTanggalIndonesia(tanggalAkhir);
    const periode = tanggalMulai === tanggalAkhir ? tglAwal : `${tglAwal} - ${tglAkhir}`;
    const header = `📋 *DAFTAR BELANJA - ${namaUsaha.toUpperCase()}*\n📅 Periode: ${periode}\n`;
    const daftarBahan = items.length > 0
        ? items.map((item) => `• ${item.nama}: *${item.tampilan_ramah}* (${formatRupiah(item.biaya)})`).join('\n')
        : '• (Tidak ada bahan yang perlu dibeli)';
    const ringkasanBiaya = `\n\n💰 *Perkiraan Biaya Bahan:* ${formatRupiah(totalBiaya)}`;
    let peringatan = '';
    if (menuTanpaResep && menuTanpaResep.length > 0) {
        peringatan = `\n\n⚠️ *Perhatian:* Menu berikut belum memiliki resep (belum masuk daftar belanja):\n` +
            menuTanpaResep.map((m) => `- ${m.nama}`).join('\n');
    }
    const footer = `\n\n_Dibuat otomatis oleh KateringKu_`;
    return `${header}\n${daftarBahan}${ringkasanBiaya}${peringatan}${footer}`;
}
//# sourceMappingURL=format.js.map