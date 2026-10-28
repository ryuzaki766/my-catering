"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authService_js_1 = require("../services/authService.js");
const onboardingService_js_1 = require("../services/onboardingService.js");
const pesananService_js_1 = require("../services/pesananService.js");
async function runSeed() {
    console.log('🌱 Menjalankan Seeding Data KateringKu...');
    const authService = new authService_js_1.AuthService();
    const onboardingService = new onboardingService_js_1.OnboardingService();
    const pesananService = new pesananService_js_1.PesananService();
    try {
        // 1. Buat Akun & Usaha
        const session = await authService.register({
            email: 'demo@kateringku.id',
            password: 'password123',
            nama_usaha: 'Catering Berkah Bu Rina',
        });
        console.log('✅ Akun demo berhasil dibuat: demo@kateringku.id (pass: password123)');
        console.log(`✅ Usaha terdaftar: ${session.usaha.nama} (ID: ${session.usaha.id})`);
        // 2. Isi data contoh bahan, menu, dan resep
        await onboardingService.seedContohData(session.usaha.id);
        console.log('✅ 6 Bahan baku, 3 menu, dan resep berhasil ditambahkan!');
        console.log('\n✨ Seeding selesai dengan sukses!');
    }
    catch (err) {
        console.error('❌ Gagal menjalankan seed:', err.message);
    }
}
runSeed();
//# sourceMappingURL=seed.js.map