import { AuthService } from '../services/authService.js';
import { OnboardingService } from '../services/onboardingService.js';
import { PesananService } from '../services/pesananService.js';

async function runSeed() {
  console.log('🌱 Menjalankan Seeding Data KateringKu...');

  const authService = new AuthService();
  const onboardingService = new OnboardingService();
  const pesananService = new PesananService();

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
  } catch (err: any) {
    console.error('❌ Gagal menjalankan seed:', err.message);
  }
}

runSeed();
